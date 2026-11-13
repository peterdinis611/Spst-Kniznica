using BookingService.Data;
using BookingService.Interfaces;

namespace BookingService.Repositories;

public class UnitOfWork(BookingDbContext db, IBookingRepository bookings) : IUnitOfWork
{
    public IBookingRepository Bookings { get; } = bookings;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);

    public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default)
        => db.Database.BeginTransactionAsync(cancellationToken);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
