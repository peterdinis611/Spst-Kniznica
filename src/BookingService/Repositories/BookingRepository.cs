using BookingService.Data;
using BookingService.DTOs;
using BookingService.Exceptions;
using BookingService.Interfaces;
using BookingService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Pagination;

namespace BookingService.Repositories;

public class BookingRepository(BookingDbContext db) : IBookingRepository
{
    public async Task<PagedResult<Booking>> FindAsync(
        BookingQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);

        var pagingErrors = filter.Validate();
        if (pagingErrors.Count > 0)
        {
            throw new AppValidationException(
                pagingErrors.ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase));
        }

        filter.Normalize();

        var query = db.Bookings.AsNoTracking().AsQueryable();

        if (filter.BookId.HasValue)
        {
            EnsureValidId(filter.BookId.Value, "BookId");
            query = query.Where(b => b.BookId == filter.BookId.Value);
        }

        if (filter.BookCopyId.HasValue)
        {
            EnsureValidId(filter.BookCopyId.Value, "BookCopyId");
            query = query.Where(b => b.BookCopyId == filter.BookCopyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.BorrowerEmail))
        {
            var email = filter.BorrowerEmail.Trim().ToLowerInvariant();
            query = query.Where(b => b.BorrowerEmail.ToLower() == email);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(b => b.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search;
            query = query.Where(b =>
                EF.Functions.Like(b.BorrowerName, $"%{search}%") ||
                EF.Functions.Like(b.BorrowerEmail, $"%{search}%") ||
                (b.Notes != null && EF.Functions.Like(b.Notes, $"%{search}%")));
        }

        // SQLite cannot ORDER BY DateTimeOffset in SQL — filter in DB, sort/page in memory.
        var filtered = await query.ToListAsync(cancellationToken);
        var sorted = SortInMemory(filtered, filter.SortBy, filter.IsDescending);
        var totalCount = sorted.Count;
        var items = sorted
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        return new PagedResult<Booking>
        {
            Items = items,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    private static List<Booking> SortInMemory(
        IReadOnlyList<Booking> items,
        string sortBy,
        bool descending)
    {
        Func<Booking, IComparable> key = sortBy.Trim().ToLowerInvariant() switch
        {
            "status" => b => (int)b.Status,
            "borrowername" => b => b.BorrowerName,
            "borroweremail" => b => b.BorrowerEmail,
            "reservedat" => b => b.ReservedAt.UtcTicks,
            "borrowedat" => b => b.BorrowedAt?.UtcTicks ?? long.MinValue,
            "createdat" => b => b.CreatedAt.UtcTicks,
            "updatedat" => b => b.UpdatedAt.UtcTicks,
            _ => b => b.DueDate.UtcTicks
        };

        return descending
            ? items.OrderByDescending(key).ToList()
            : items.OrderBy(key).ToList();
    }

    public Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Bookings.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public Task<Booking?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Bookings.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public Task AddAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(booking);
        return db.Bookings.AddAsync(booking, cancellationToken).AsTask();
    }

    public void Update(Booking booking)
    {
        ArgumentNullException.ThrowIfNull(booking);
        db.Bookings.Update(booking);
    }

    public void Remove(Booking booking)
    {
        ArgumentNullException.ThrowIfNull(booking);
        db.Bookings.Remove(booking);
    }

    public Task<bool> HasActiveBookingForCopyAsync(
        Guid bookCopyId,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        EnsureValidId(bookCopyId, "BookCopyId");

        var query = db.Bookings.AsNoTracking()
            .Where(b =>
                b.BookCopyId == bookCopyId &&
                (b.Status == BookingStatus.Reserved ||
                 b.Status == BookingStatus.Active ||
                 b.Status == BookingStatus.Overdue));

        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task<int> CountActiveBookingsForBookAsync(
        Guid bookId,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        EnsureValidId(bookId, "BookId");

        var query = db.Bookings.AsNoTracking()
            .Where(b =>
                b.BookId == bookId &&
                (b.Status == BookingStatus.Reserved ||
                 b.Status == BookingStatus.Active ||
                 b.Status == BookingStatus.Overdue));

        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.CountAsync(cancellationToken);
    }

    public Task<bool> HasActiveBookingForBorrowerOnBookAsync(
        Guid bookId,
        string borrowerEmail,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        EnsureValidId(bookId, "BookId");
        if (string.IsNullOrWhiteSpace(borrowerEmail))
        {
            return Task.FromResult(false);
        }

        var normalized = borrowerEmail.Trim().ToLowerInvariant();
        var query = db.Bookings.AsNoTracking()
            .Where(b =>
                b.BookId == bookId &&
                b.BorrowerEmail.ToLower() == normalized &&
                (b.Status == BookingStatus.Reserved ||
                 b.Status == BookingStatus.Active ||
                 b.Status == BookingStatus.Overdue));

        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task<int> CountOpenBookingsForBorrowerAsync(
        string borrowerEmail,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(borrowerEmail))
        {
            return Task.FromResult(0);
        }

        var normalized = borrowerEmail.Trim().ToLowerInvariant();
        var query = db.Bookings.AsNoTracking()
            .Where(b =>
                b.BorrowerEmail.ToLower() == normalized &&
                (b.Status == BookingStatus.Reserved ||
                 b.Status == BookingStatus.Active ||
                 b.Status == BookingStatus.Overdue));

        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.CountAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Booking>> ListActivePastDueAsync(
        DateTimeOffset asOfUtc,
        CancellationToken cancellationToken = default)
    {
        var items = await db.Bookings
            .Where(b => b.Status == BookingStatus.Active)
            .ToListAsync(cancellationToken);
        return items.Where(b => b.DueDate < asOfUtc).ToList();
    }

    public async Task<IReadOnlyList<Booking>> ListDueSoonAsync(
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken cancellationToken = default)
    {
        var items = await db.Bookings
            .Where(b => b.Status == BookingStatus.Active || b.Status == BookingStatus.Reserved)
            .ToListAsync(cancellationToken);
        return items
            .Where(b => b.DueDate >= fromUtc && b.DueDate <= toUtc)
            .OrderBy(b => b.DueDate)
            .ToList();
    }

    private static void EnsureValidId(Guid id, string field = "Id")
    {
        if (id == Guid.Empty)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                [field] = [$"{field} must be a non-empty GUID."]
            });
        }
    }
}
