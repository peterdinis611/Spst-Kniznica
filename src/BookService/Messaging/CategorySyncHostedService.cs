using System.Text;
using BookService.Data;
using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Messaging;

namespace BookService.Messaging;

public sealed class CategorySyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<KafkaPublisherOptions> options,
    ILogger<CategorySyncHostedService> logger) : BackgroundService
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
                    GroupId = "book-service-catalog-sync",
                    ClientId = $"{kafka.ClientId}-catalog-sync",
                    AutoOffsetReset = AutoOffsetReset.Earliest,
                    EnableAutoCommit = true,
                    SocketTimeoutMs = 10000
                }).Build();

                consumer.Subscribe(kafka.Topic);
                logger.LogInformation("BookService catalog sync subscribed to {Topic}", kafka.Topic);

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var result = consumer.Consume(stoppingToken);
                        if (result?.Message?.Value is null)
                        {
                            continue;
                        }

                        var eventType = result.Message.Headers?
                            .FirstOrDefault(h => h.Key == "event-type") is { } header
                            ? Encoding.UTF8.GetString(header.GetValueBytes())
                            : EventJson.TryGetEventType(Encoding.UTF8.GetBytes(result.Message.Value))
                              ?? "Unknown";

                        if (eventType is not (
                            nameof(CategoryUpdatedEvent) or nameof(CategoryDeletedEvent)
                            or nameof(AuthorUpdatedEvent) or nameof(AuthorDeletedEvent)))
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
                        logger.LogError(ex, "Category sync consume error: {Reason}", ex.Error.Reason);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        logger.LogError(ex, "Category sync failed to apply event");
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
                logger.LogError(ex, "Category sync disconnected; retrying in 5s");
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
            case nameof(CategoryUpdatedEvent):
            {
                var updated = EventJson.Deserialize<CategoryUpdatedEvent>(payload);
                if (updated is null)
                {
                    return;
                }

                var books = await db.Books
                    .Where(b => b.CategoryId == updated.CategoryId)
                    .ToListAsync(cancellationToken);

                foreach (var book in books)
                {
                    book.CategoryName = updated.Name;
                    book.UpdatedAt = DateTimeOffset.UtcNow;
                }

                if (books.Count > 0)
                {
                    await db.SaveChangesAsync(cancellationToken);
                    logger.LogInformation(
                        "Synced category name '{Name}' to {Count} books",
                        updated.Name,
                        books.Count);
                }

                return;
            }
            case nameof(CategoryDeletedEvent):
            {
                var deleted = EventJson.Deserialize<CategoryDeletedEvent>(payload);
                if (deleted is null)
                {
                    return;
                }

                var linked = await db.Books
                    .Where(b => b.CategoryId == deleted.CategoryId)
                    .ToListAsync(cancellationToken);

                foreach (var book in linked)
                {
                    book.CategoryId = null;
                    book.CategoryName = null;
                    book.UpdatedAt = DateTimeOffset.UtcNow;
                }

                if (linked.Count > 0)
                {
                    await db.SaveChangesAsync(cancellationToken);
                    logger.LogInformation(
                        "Cleared deleted category {CategoryId} from {Count} books",
                        deleted.CategoryId,
                        linked.Count);
                }

                return;
            }
            case nameof(AuthorUpdatedEvent):
            {
                var updated = EventJson.Deserialize<AuthorUpdatedEvent>(payload);
                if (updated is null)
                {
                    return;
                }

                var books = await db.Books
                    .Where(b => b.AuthorId == updated.AuthorId)
                    .ToListAsync(cancellationToken);

                foreach (var book in books)
                {
                    book.Author = updated.Name;
                    book.UpdatedAt = DateTimeOffset.UtcNow;
                }

                if (books.Count > 0)
                {
                    await db.SaveChangesAsync(cancellationToken);
                    logger.LogInformation(
                        "Synced author name '{Name}' to {Count} books",
                        updated.Name,
                        books.Count);
                }

                return;
            }
            case nameof(AuthorDeletedEvent):
            {
                var deleted = EventJson.Deserialize<AuthorDeletedEvent>(payload);
                if (deleted is null)
                {
                    return;
                }

                var linked = await db.Books
                    .Where(b => b.AuthorId == deleted.AuthorId)
                    .ToListAsync(cancellationToken);

                foreach (var book in linked)
                {
                    book.AuthorId = null;
                    book.Author = "Unknown";
                    book.UpdatedAt = DateTimeOffset.UtcNow;
                }

                if (linked.Count > 0)
                {
                    await db.SaveChangesAsync(cancellationToken);
                    logger.LogInformation(
                        "Cleared deleted author {AuthorId} from {Count} books",
                        deleted.AuthorId,
                        linked.Count);
                }

                return;
            }
        }
    }
}
