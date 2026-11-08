using System.Linq.Expressions;
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
    private static readonly IReadOnlyDictionary<string, Expression<Func<Booking, object>>> SortMap =
        new Dictionary<string, Expression<Func<Booking, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["duedate"] = b => b.DueDate,
            ["reservedat"] = b => b.ReservedAt,
            ["borrowedat"] = b => b.BorrowedAt!,
            ["createdat"] = b => b.CreatedAt,
            ["updatedat"] = b => b.UpdatedAt,
            ["status"] = b => b.Status,
            ["borrowername"] = b => b.BorrowerName,
            ["borroweremail"] = b => b.BorrowerEmail
        };

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

        query = query.OrderByProperty(filter.SortBy, filter.IsDescending, SortMap, b => b.DueDate);
        return await query.ToPagedResultAsync(filter, cancellationToken);
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
