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
    private sealed class BookCatalogResponse
    {
        public Guid BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int TotalCopies { get; set; }
        public int AvailableCopies { get; set; }
    }

    private sealed class BookCopyLendabilityResponse
    {
        public Guid CopyId { get; set; }
        public Guid BookId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsLendable { get; set; }
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

            AttachInternalKey(request);

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
            var body = await response.Content.ReadFromJsonAsync<BookCatalogResponse>(
                cancellationToken: cancellationToken);

            if (body is null)
            {
                return null;
            }

            return ToSnapshot(body);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Book catalog lookup failed for {BookId}", bookId);
            return null;
        }
    }

    public async Task<IReadOnlyDictionary<Guid, BookAvailabilitySnapshot>> GetBooksAsync(
        IEnumerable<Guid> bookIds,
        CancellationToken cancellationToken = default)
    {
        var ids = bookIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .Take(100)
            .ToArray();

        if (ids.Length == 0)
        {
            return new Dictionary<Guid, BookAvailabilitySnapshot>();
        }

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "api/internal/books/summaries");

            AttachInternalKey(request);
            request.Content = JsonContent.Create(new { ids });

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Batch book lookup returned {Status} for {Count} ids",
                    (int)response.StatusCode,
                    ids.Length);
                return await FallbackOneByOneAsync(ids, cancellationToken);
            }

            var body = await response.Content.ReadFromJsonAsync<List<BookCatalogResponse>>(
                cancellationToken: cancellationToken);

            return (body ?? [])
                .Where(b => b.BookId != Guid.Empty)
                .ToDictionary(b => b.BookId, ToSnapshot);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Batch book catalog lookup failed for {Count} ids", ids.Length);
            return await FallbackOneByOneAsync(ids, cancellationToken);
        }
    }

    public async Task<BookCopyLendability?> GetCopyLendabilityAsync(
        Guid copyId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"api/internal/books/copies/{copyId}/lendability");

            AttachInternalKey(request);

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            if (response.StatusCode is System.Net.HttpStatusCode.Unauthorized
                or System.Net.HttpStatusCode.Forbidden)
            {
                logger.LogWarning(
                    "Internal copy lendability unauthorized for {CopyId} — check InternalApi:SharedKey",
                    copyId);
                return null;
            }

            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<BookCopyLendabilityResponse>(
                cancellationToken: cancellationToken);
            if (body is null || body.CopyId == Guid.Empty)
            {
                return null;
            }

            return new BookCopyLendability(
                body.CopyId,
                body.BookId,
                body.Status ?? string.Empty,
                body.IsLendable);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Book copy lendability lookup failed for {CopyId}", copyId);
            return null;
        }
    }

    private async Task<IReadOnlyDictionary<Guid, BookAvailabilitySnapshot>> FallbackOneByOneAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken)
    {
        var map = new Dictionary<Guid, BookAvailabilitySnapshot>();
        foreach (var id in ids)
        {
            var snap = await GetBookAsync(id, cancellationToken);
            if (snap is not null)
            {
                map[id] = snap;
            }
        }

        return map;
    }

    private void AttachInternalKey(HttpRequestMessage request)
    {
        var key = internalApi.Value.SharedKey?.Trim();
        if (!string.IsNullOrEmpty(key))
        {
            request.Headers.TryAddWithoutValidation(InternalApiOptions.HeaderName, key);
        }
    }

    private static BookAvailabilitySnapshot ToSnapshot(BookCatalogResponse body) =>
        new(
            Math.Max(body.TotalCopies, 1),
            Math.Max(body.AvailableCopies, 0),
            body.Title ?? string.Empty,
            body.Author ?? string.Empty);
}
