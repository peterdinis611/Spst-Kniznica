using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Integrations;

public sealed class OpenLibraryClient(HttpClient http, ILogger<OpenLibraryClient> logger)
{
    public async Task<IsbnLookupResult?> LookupByIsbnAsync(string isbn, CancellationToken cancellationToken = default)
    {
        var normalized = OpenLibraryCovers.NormalizeIsbn(isbn);
        if (normalized is null) return null;

        try
        {
            var url =
                $"https://openlibrary.org/api/books?bibkeys=ISBN:{normalized}&format=json&jscmd=data";
            using var response = await http.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogDebug("Open Library returned {Status} for ISBN {Isbn}", (int)response.StatusCode, normalized);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (!doc.RootElement.TryGetProperty($"ISBN:{normalized}", out var book)
                && !doc.RootElement.TryGetProperty($"ISBN:{isbn}", out book))
            {
                // OL sometimes keys by the requested string variant
                var first = doc.RootElement.EnumerateObject().FirstOrDefault();
                if (first.Value.ValueKind != JsonValueKind.Object) return null;
                book = first.Value;
            }

            var authors = book.TryGetProperty("authors", out var authorsEl) && authorsEl.ValueKind == JsonValueKind.Array
                ? string.Join(", ", authorsEl.EnumerateArray()
                    .Select(a => a.TryGetProperty("name", out var n) ? n.GetString() : null)
                    .Where(s => !string.IsNullOrWhiteSpace(s)))
                : null;

            var publishers = book.TryGetProperty("publishers", out var pubs) && pubs.ValueKind == JsonValueKind.Array
                ? pubs.EnumerateArray()
                    .Select(p => p.TryGetProperty("name", out var n) ? n.GetString() : null)
                    .FirstOrDefault(s => !string.IsNullOrWhiteSpace(s))
                : null;

            int? year = null;
            if (book.TryGetProperty("publish_date", out var dateEl))
            {
                var date = dateEl.GetString();
                if (!string.IsNullOrWhiteSpace(date))
                {
                    var digits = new string(date.Where(char.IsDigit).Take(4).ToArray());
                    if (int.TryParse(digits, out var y) && y is >= 1000 and <= 2100) year = y;
                }
            }

            int? pages = null;
            if (book.TryGetProperty("number_of_pages", out var pagesEl) && pagesEl.TryGetInt32(out var p))
            {
                pages = p;
            }

            var title = book.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : null;
            var subtitle = book.TryGetProperty("subtitle", out var subEl) ? subEl.GetString() : null;
            var olUrl = book.TryGetProperty("url", out var urlEl) ? urlEl.GetString() : null;
            var cover = OpenLibraryCovers.ForIsbn(normalized);

            if (string.IsNullOrWhiteSpace(title)) return null;

            return new IsbnLookupResult
            {
                Isbn = normalized,
                Title = title,
                Subtitle = subtitle,
                Authors = authors,
                Publisher = publishers,
                PublishedYear = year,
                PageCount = pages,
                CoverUrl = cover,
                Source = "OpenLibrary",
                SourceUrl = olUrl,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Open Library lookup failed for ISBN {Isbn}", normalized);
            return null;
        }
    }
}
