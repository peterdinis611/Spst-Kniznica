using BookingService.DTOs;
using BookingService.Models;
using SpstKniznica.Common.Pagination;

namespace BookingService.Interfaces;

public interface IBookingRepository
{
    Task<PagedResult<Booking>> FindAsync(BookingQueryFilter filter, CancellationToken cancellationToken = default);
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Booking?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Booking booking, CancellationToken cancellationToken = default);
    void Update(Booking booking);
    void Remove(Booking booking);
    Task<bool> HasActiveBookingForCopyAsync(Guid bookCopyId, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
