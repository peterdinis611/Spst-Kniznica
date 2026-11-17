namespace BookingService.Interfaces;

public sealed record BookAvailabilitySnapshot(
    int TotalCopies,
    int AvailableCopies,
    string Title = "",
    string Author = "");

public interface IBookCatalogLookup
{
    Task<BookAvailabilitySnapshot?> GetBookAsync(
        Guid bookId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, BookAvailabilitySnapshot>> GetBooksAsync(
        IEnumerable<Guid> bookIds,
        CancellationToken cancellationToken = default);
}
