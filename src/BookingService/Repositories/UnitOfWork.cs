using BookingService.Data;
using BookingService.Interfaces;

namespace BookingService.Repositories;

public class UnitOfWork(BookingDbContext db, IBookingRepository bookings) : IUnitOfWork
{
    public IBookingRepository Bookings { get; } = bookings;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
