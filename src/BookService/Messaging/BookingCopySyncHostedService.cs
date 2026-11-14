using System.Text;
using BookService.Data;
using BookService.Models;
using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Messaging;

namespace BookService.Messaging;

/// <summary>
/// Applies booking lifecycle events to <see cref="BookCopy"/> status so catalog availability matches reality.
/// </summary>
public sealed class BookingCopySyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<KafkaPublisherOptions> options,
    ILogger<BookingCopySyncHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var kafka = options.Value;
        if (!kafka.Enabled)
        {
            return Task.CompletedTask;
        }

        return Task.Run(() => ConsumeLoop(kafka, stoppingToken), stoppingToken);
    }

    private void ConsumeLoop(KafkaPublisherOptions kafka, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var consumer = new ConsumerBuilder<string, string>(new ConsumerConfig
                {
                    BootstrapServers = kafka.BootstrapServers,
                    GroupId = "book-service-booking-copy-sync",
                    ClientId = $"{kafka.ClientId}-booking-copy-sync",
                    AutoOffsetReset = AutoOffsetReset.Earliest,
                    EnableAutoCommit = true,
                    SocketTimeoutMs = 10000
                }).Build();

                consumer.Subscribe(kafka.Topic);
                logger.LogInformation("BookService booking-copy sync subscribed to {Topic}", kafka.Topic);

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var result = consumer.Consume(stoppingToken);
                        if (result?.Message?.Value is null) continue;

                        var eventType = result.Message.Headers?
                            .FirstOrDefault(h => h.Key == "event-type") is { } header
                            ? Encoding.UTF8.GetString(header.GetValueBytes())
                            : EventJson.TryGetEventType(Encoding.UTF8.GetBytes(result.Message.Value))
                              ?? "Unknown";

                        if (eventType is not (
                            nameof(BookingCreatedEvent)
                            or nameof(BookingUpdatedEvent)
                            or nameof(BookingDeletedEvent)))
                        {
                            continue;
                        }

                        using var scope = scopeFactory.CreateScope();
                        var db = scope.ServiceProvider.GetRequiredService<BookDbContext>();
                        ApplyAsync(db, eventType, result.Message.Value, stoppingToken)
                            .GetAwaiter()
                            .GetResult();
                    }
                    catch (ConsumeException ex)
                    {
                        logger.LogError(ex, "Booking-copy sync consume error: {Reason}", ex.Error.Reason);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        logger.LogError(ex, "Booking-copy sync failed to apply event");
                    }
                }

                consumer.Close();
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Booking-copy sync disconnected; retrying in 5s");
                try
                {
                    Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).GetAwaiter().GetResult();
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    private async Task ApplyAsync(
        BookDbContext db,
        string eventType,
        string payload,
        CancellationToken cancellationToken)
    {
        switch (eventType)
        {
            case nameof(BookingCreatedEvent):
            {
                var created = EventJson.Deserialize<BookingCreatedEvent>(payload);
                if (created is null) return;
                await ApplyStatusAsync(
                    db,
                    created.BookId,
                    created.BookCopyId,
                    created.Status,
                    cancellationToken);
                return;
            }
            case nameof(BookingUpdatedEvent):
            {
                var updated = EventJson.Deserialize<BookingUpdatedEvent>(payload);
                if (updated is null) return;
                await ApplyStatusAsync(
                    db,
                    updated.BookId,
                    updated.BookCopyId,
                    updated.Status,
                    cancellationToken);
                return;
            }
            case nameof(BookingDeletedEvent):
            {
                var deleted = EventJson.Deserialize<BookingDeletedEvent>(payload);
                if (deleted is null) return;
                // Without copy id, free one reserved/borrowed copy on the book if counts look off.
                await ReleaseAnyBusyCopyAsync(db, deleted.BookId, cancellationToken);
                return;
            }
        }
    }

    private async Task ApplyStatusAsync(
        BookDbContext db,
        Guid bookId,
        Guid? bookCopyId,
        string bookingStatus,
        CancellationToken cancellationToken)
    {
        var target = MapCopyStatus(bookingStatus);
        var bookIdText = bookId.ToString();

        var book = await db.Books
            .Include(b => b.Copies)
            .FirstOrDefaultAsync(b => b.Id.ToString() == bookIdText, cancellationToken);

        if (book is null)
        {
            logger.LogDebug("Booking-copy sync: book {BookId} not found", bookId);
            return;
        }

        BookCopy? copy = null;
        if (bookCopyId is { } copyId)
        {
            var copyText = copyId.ToString();
            copy = book.Copies.FirstOrDefault(c => c.Id.ToString() == copyText);
        }

        if (copy is null && target is BookCopyStatus.Reserved or BookCopyStatus.Borrowed)
        {
            copy = book.Copies.FirstOrDefault(c => c.Status == BookCopyStatus.Available);
        }

        if (copy is null && target == BookCopyStatus.Available && bookCopyId is null)
        {
            copy = book.Copies.FirstOrDefault(c =>
                c.Status is BookCopyStatus.Reserved or BookCopyStatus.Borrowed);
        }

        if (copy is null)
        {
            logger.LogDebug(
                "Booking-copy sync: no copy to update for book {BookId} status {Status}",
                bookId,
                bookingStatus);
            return;
        }

        if (copy.Status == target)
        {
            return;
        }

        copy.Status = target;
        book.RecalculateCopyCounts();
        book.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Synced copy {CopyId} on book {BookId} → {CopyStatus} (from booking {BookingStatus})",
            copy.Id,
            bookId,
            target,
            bookingStatus);
    }

    private async Task ReleaseAnyBusyCopyAsync(
        BookDbContext db,
        Guid bookId,
        CancellationToken cancellationToken)
    {
        await ApplyStatusAsync(db, bookId, null, nameof(BookingStatusFree), cancellationToken);
    }

    private static BookCopyStatus MapCopyStatus(string bookingStatus) =>
        bookingStatus.Trim().ToLowerInvariant() switch
        {
            "reserved" => BookCopyStatus.Reserved,
            "active" => BookCopyStatus.Borrowed,
            "overdue" => BookCopyStatus.Borrowed,
            "returned" => BookCopyStatus.Available,
            "cancelled" => BookCopyStatus.Available,
            "free" => BookCopyStatus.Available,
            _ => BookCopyStatus.Available,
        };

    // Sentinel for delete path.
    private const string BookingStatusFree = "Free";
}
