using Microsoft.EntityFrameworkCore.Storage;

namespace BookingService.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    IBookingRepository Bookings { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
