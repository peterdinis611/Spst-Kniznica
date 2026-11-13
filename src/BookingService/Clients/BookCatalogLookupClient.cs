using System.Net.Http.Json;
using BookingService.Interfaces;

namespace BookingService.Clients;

public sealed class BookCatalogOptions
{
    public const string SectionName = "Services";

    public string BookService { get; set; } = "http://127.0.0.1:5203";
}

internal sealed class BookCatalogLookupClient(
    HttpClient httpClient,
    ILogger<BookCatalogLookupClient> logger) : IBookCatalogLookup
{
    private sealed class BookDetailResponse
    {
        public int TotalCopies { get; set; }
        public int AvailableCopies { get; set; }
    }

    public async Task<BookAvailabilitySnapshot?> GetBookAsync(
        Guid bookId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync($"api/books/{bookId}", cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<BookDetailResponse>(
                cancellationToken: cancellationToken);

            if (body is null)
            {
                return null;
            }

            return new BookAvailabilitySnapshot(
                Math.Max(body.TotalCopies, 1),
                Math.Max(body.AvailableCopies, 0));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Book catalog lookup failed for {BookId}", bookId);
            return null;
        }
    }
}
