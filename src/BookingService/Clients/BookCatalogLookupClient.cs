using System.Net.Http.Json;
using BookingService.Interfaces;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace BookingService.Clients;

public sealed class BookCatalogOptions
{
    public const string SectionName = "Services";

    public string BookService { get; set; } = "http://127.0.0.1:5203";
}

internal sealed class BookCatalogLookupClient(
    HttpClient httpClient,
    IOptions<InternalApiOptions> internalApi,
    ILogger<BookCatalogLookupClient> logger) : IBookCatalogLookup
{
    private sealed class BookAvailabilityResponse
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
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"api/internal/books/{bookId}/availability");

            var key = internalApi.Value.SharedKey?.Trim();
            if (!string.IsNullOrEmpty(key))
            {
                request.Headers.TryAddWithoutValidation(InternalApiOptions.HeaderName, key);
            }

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            if (response.StatusCode is System.Net.HttpStatusCode.Unauthorized
                or System.Net.HttpStatusCode.Forbidden)
            {
                logger.LogWarning(
                    "Internal book lookup unauthorized for {BookId} — check InternalApi:SharedKey",
                    bookId);
                return null;
            }

            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<BookAvailabilityResponse>(
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
