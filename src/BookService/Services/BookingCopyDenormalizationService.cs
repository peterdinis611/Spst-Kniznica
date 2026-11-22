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

        if (!TryMapCopyStatus(bookingStatus, out var target))
        {
            logger.LogWarning(
                "Booking-copy sync skipped for book {BookId} copy {CopyId}: unknown booking status {Status}",
                bookId,
                bookCopyId,
                bookingStatus);
            return;
        }

        for (var attempt = 1; attempt <= 2; attempt++)
        {
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

            if (copy.Status is BookCopyStatus.Lost or BookCopyStatus.Maintenance)
            {
                logger.LogInformation(
                    "Booking-copy sync left copy {CopyId} on {CopyStatus}; staff exception is not overwritten by booking {BookingStatus}",
                    copy.Id,
                    copy.Status,
                    bookingStatus);
                return;
            }

            if (copy.Status == target)
            {
                return;
            }

            copy.Status = target;
            copy.Version++;
            copy.UpdatedAt = DateTimeOffset.UtcNow;
            book.RecalculateCopyCounts();
            book.UpdatedAt = DateTimeOffset.UtcNow;

            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException) when (attempt == 1)
            {
                logger.LogInformation(
                    "Booking-copy sync retrying copy {CopyId} after a concurrent update",
                    bookCopyId);
                db.ChangeTracker.Clear();
                continue;
            }

            await cache.RemoveAsync(CacheKeys.Book(bookId), cancellationToken);
            await cache.RemoveByPrefixAsync(CacheKeys.BookListPrefix, cancellationToken);

            logger.LogInformation(
                "Synced copy {CopyId} on book {BookId} → {CopyStatus} (from booking {BookingStatus})",
                copy.Id,
                bookId,
                target,
                bookingStatus);
            return;
        }
    }

    private static bool TryMapCopyStatus(string bookingStatus, out BookCopyStatus status)
    {
        switch (bookingStatus.Trim().ToLowerInvariant())
        {
            case "reserved":
                status = BookCopyStatus.Reserved;
                return true;
            case "active":
            case "overdue":
                status = BookCopyStatus.Borrowed;
                return true;
            case "returned":
            case "cancelled":
            case "free":
                status = BookCopyStatus.Available;
                return true;
            default:
                status = default;
                return false;
        }
    }
}
