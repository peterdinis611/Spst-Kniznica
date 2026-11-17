using BookService.Data;
using BookService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace BookService.Services;

/// <summary>
/// Applies booking lifecycle events to <see cref="BookCopy"/> status (Kafka or HTTP).
/// Requires an explicit <c>BookCopyId</c> — never picks an arbitrary copy.
/// </summary>
public sealed class BookingCopyDenormalizationService(
    BookDbContext db,
    IAppCache cache,
    ILogger<BookingCopyDenormalizationService> logger)
{
    public async Task ApplyEventPayloadAsync(
        string eventType,
        string payload,
        CancellationToken cancellationToken = default)
    {
        switch (eventType)
        {
            case nameof(BookingCreatedEvent):
            {
                var created = EventJson.Deserialize<BookingCreatedEvent>(payload);
                if (created is null) return;
                await ApplyStatusAsync(
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
                await ApplyStatusAsync(deleted.BookId, deleted.BookCopyId, "Free", cancellationToken);
                return;
            }
        }
    }

    public async Task ApplyStatusAsync(
        Guid bookId,
        Guid? bookCopyId,
        string bookingStatus,
        CancellationToken cancellationToken = default)
    {
        if (bookCopyId is null || bookCopyId == Guid.Empty)
        {
            logger.LogWarning(
                "Booking-copy sync skipped for book {BookId} status {Status}: BookCopyId is required",
                bookId,
                bookingStatus);
            return;
        }

        var target = MapCopyStatus(bookingStatus);

        var book = await db.Books
            .Include(b => b.Copies)
            .FirstOrDefaultAsync(b => b.Id == bookId, cancellationToken);

        if (book is null)
        {
            logger.LogDebug("Booking-copy sync: book {BookId} not found", bookId);
            return;
        }

        var copy = book.Copies.FirstOrDefault(c => c.Id == bookCopyId.Value);
        if (copy is null)
        {
            logger.LogWarning(
                "Booking-copy sync: copy {CopyId} not found on book {BookId}",
                bookCopyId,
                bookId);
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
        await cache.RemoveAsync(CacheKeys.Book(bookId), cancellationToken);

        logger.LogInformation(
            "Synced copy {CopyId} on book {BookId} → {CopyStatus} (from booking {BookingStatus})",
            copy.Id,
            bookId,
            target,
            bookingStatus);
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
}
