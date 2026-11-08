using BookingService.DTOs;
using SpstKniznica.Common.Pagination;

namespace BookingService.Interfaces;

public interface IBookingService
{
    Task<PagedResult<BookingDto>> SearchAsync(BookingQueryFilter filter, CancellationToken cancellationToken = default);
    Task<BookingDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingDto> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken = default);
    Task<BookingDto> UpdateAsync(Guid id, UpdateBookingRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
