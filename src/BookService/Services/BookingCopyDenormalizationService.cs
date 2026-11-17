using BookService.Data;
using BookService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Messaging;

namespace BookService.Services;

/// <summary>
/// Applies booking lifecycle events to <see cref="BookCopy"/> status (Kafka or HTTP).
/// </summary>
public sealed class BookingCopyDenormalizationService(
    BookDbContext db,
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
                await ApplyStatusAsync(deleted.BookId, null, "Free", cancellationToken);
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
        var target = MapCopyStatus(bookingStatus);

        var book = await db.Books
            .Include(b => b.Copies)
            .FirstOrDefaultAsync(b => b.Id == bookId, cancellationToken);

        if (book is null)
        {
            logger.LogDebug("Booking-copy sync: book {BookId} not found", bookId);
            return;
        }

        BookCopy? copy = null;
        if (bookCopyId is { } copyId)
        {
            copy = book.Copies.FirstOrDefault(c => c.Id == copyId);
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
