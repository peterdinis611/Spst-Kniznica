namespace BookingService.Interfaces;

public sealed record BookAvailabilitySnapshot(int TotalCopies, int AvailableCopies);

public interface IBookCatalogLookup
{
    Task<BookAvailabilitySnapshot?> GetBookAsync(Guid bookId, CancellationToken cancellationToken = default);
}
