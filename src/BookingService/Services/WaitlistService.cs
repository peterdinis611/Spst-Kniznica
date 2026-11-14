using BookingService.Data;
using BookingService.DTOs;
using BookingService.Exceptions;
using BookingService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Text;

namespace BookingService.Services;

public sealed class WaitlistService(
    BookingDbContext db,
    ILogger<WaitlistService> logger)
{
    public async Task<WaitlistEntryDto> JoinAsync(
        JoinWaitlistRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.BookId == Guid.Empty)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["BookId"] = ["BookId is required."]
            });
        }

        var email = StringNormalize.Required(request.BorrowerEmail).ToLowerInvariant();
        var name = StringNormalize.Required(request.BorrowerName);

        var existing = await db.Waitlist.AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.BookId == request.BookId && w.BorrowerEmail == email,
                cancellationToken);
        if (existing is not null)
        {
            return await ToDtoAsync(existing, cancellationToken);
        }

        var entry = new WaitlistEntry
        {
            Id = Guid.NewGuid(),
            BookId = request.BookId,
            BorrowerName = name,
            BorrowerEmail = email,
            Notes = StringNormalize.Optional(request.Notes),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.Waitlist.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Waitlist join {EntryId} for book {BookId} ({Email})",
            entry.Id,
            entry.BookId,
            email);

        return await ToDtoAsync(entry, cancellationToken);
    }

    public async Task<IReadOnlyList<WaitlistEntryDto>> ListForBookAsync(
        Guid bookId,
        CancellationToken cancellationToken = default)
    {
        var items = await db.Waitlist.AsNoTracking()
            .Where(w => w.BookId == bookId)
            .ToListAsync(cancellationToken);

        return items
            .OrderBy(w => w.CreatedAt)
            .Select((w, index) => new WaitlistEntryDto
            {
                Id = w.Id,
                BookId = w.BookId,
                BorrowerName = w.BorrowerName,
                BorrowerEmail = w.BorrowerEmail,
                CreatedAt = w.CreatedAt,
                Position = index + 1,
                Notes = w.Notes,
            })
            .ToList();
    }

    public async Task<IReadOnlyList<WaitlistEntryDto>> ListForBorrowerAsync(
        string borrowerEmail,
        CancellationToken cancellationToken = default)
    {
        var email = borrowerEmail.Trim().ToLowerInvariant();
        var items = await db.Waitlist.AsNoTracking()
            .Where(w => w.BorrowerEmail == email)
            .OrderBy(w => w.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = new List<WaitlistEntryDto>();
        foreach (var item in items)
        {
            result.Add(await ToDtoAsync(item, cancellationToken));
        }

        return result;
    }

    public async Task LeaveAsync(Guid id, string? ownerEmail, bool isStaff, CancellationToken cancellationToken = default)
    {
        var entry = await db.Waitlist.FirstOrDefaultAsync(w => w.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Waitlist entry '{id}' was not found.");

        if (!isStaff)
        {
            if (string.IsNullOrWhiteSpace(ownerEmail)
                || !string.Equals(entry.BorrowerEmail, ownerEmail, StringComparison.OrdinalIgnoreCase))
            {
                throw new NotFoundException($"Waitlist entry '{id}' was not found.");
            }
        }

        db.Waitlist.Remove(entry);
        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Pop the oldest waiter for a book (if any).</summary>
    public async Task<WaitlistEntry?> DequeueNextAsync(Guid bookId, CancellationToken cancellationToken = default)
    {
        var next = (await db.Waitlist
                .Where(w => w.BookId == bookId)
                .ToListAsync(cancellationToken))
            .OrderBy(w => w.CreatedAt)
            .FirstOrDefault();

        if (next is null) return null;

        db.Waitlist.Remove(next);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Waitlist dequeue {EntryId} for book {BookId} → {Email}",
            next.Id,
            bookId,
            next.BorrowerEmail);
        return next;
    }

    private async Task<WaitlistEntryDto> ToDtoAsync(WaitlistEntry entry, CancellationToken cancellationToken)
    {
        var peers = await db.Waitlist.AsNoTracking()
            .Where(w => w.BookId == entry.BookId)
            .ToListAsync(cancellationToken);
        var ordered = peers.OrderBy(w => w.CreatedAt).Select(w => w.Id).ToList();
        var position = ordered.IndexOf(entry.Id) + 1;

        return new WaitlistEntryDto
        {
            Id = entry.Id,
            BookId = entry.BookId,
            BorrowerName = entry.BorrowerName,
            BorrowerEmail = entry.BorrowerEmail,
            CreatedAt = entry.CreatedAt,
            Position = Math.Max(position, 1),
            Notes = entry.Notes,
        };
    }
}
