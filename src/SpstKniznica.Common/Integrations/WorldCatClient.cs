using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Integrations;

public sealed class WorldCatOptions
{
    public const string SectionName = "WorldCat";
    public bool Enabled { get; set; }
    /// <summary>OCLC WSKey for WorldCat Search / catalog content API.</summary>
    public string? WsKey { get; set; }
}

/// <summary>
/// Optional WorldCat fallback when Open Library misses. Requires free-tier WSKey.
/// </summary>
public sealed class WorldCatClient(
    HttpClient http,
    IOptions<WorldCatOptions> options,
    ILogger<WorldCatClient> logger)
{
    public async Task<IsbnLookupResult?> LookupByIsbnAsync(string isbn, CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        var normalized = OpenLibraryCovers.NormalizeIsbn(isbn);
        if (!opts.Enabled || string.IsNullOrWhiteSpace(opts.WsKey) || normalized is null)
        {
            return null;
        }

        try
        {
            // WorldCat Search API v2 — bibliographic resource by ISBN
            var url =
                $"https://search.worldcat.org/api/search-bibs?q=bn:{normalized}&limit=1";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.TryAddWithoutValidation("Accept", "application/json");
            request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {opts.WsKey}");

            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogDebug("WorldCat returned {Status} for ISBN {Isbn}", (int)response.StatusCode, normalized);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            // Be tolerant of schema variants across API versions.
            JsonElement item = default;
            if (doc.RootElement.TryGetProperty("bibs", out var bibs) && bibs.GetArrayLength() > 0)
            {
                item = bibs[0];
            }
            else if (doc.RootElement.TryGetProperty("items", out var items) && items.GetArrayLength() > 0)
            {
                item = items[0];
            }
            else
            {
                return null;
            }

            var title = GetString(item, "title") ?? GetString(item, "name");
            if (string.IsNullOrWhiteSpace(title)) return null;

            return new IsbnLookupResult
            {
                Isbn = normalized,
                Title = title,
                Authors = GetString(item, "creator") ?? GetString(item, "author"),
                Publisher = GetString(item, "publisher"),
                PublishedYear = ParseYear(GetString(item, "date") ?? GetString(item, "publishDate")),
                Language = GetString(item, "language"),
                CoverUrl = OpenLibraryCovers.ForIsbn(normalized),
                Source = "WorldCat",
                SourceUrl = $"https://www.worldcat.org/isbn/{normalized}",
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "WorldCat lookup failed for ISBN {Isbn}", normalized);
            return null;
        }
    }

    private static string? GetString(JsonElement el, string name)
        => el.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;

    private static int? ParseYear(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var digits = new string(raw.Where(char.IsDigit).Take(4).ToArray());
        return int.TryParse(digits, out var y) && y is >= 1000 and <= 2100 ? y : null;
    }
}
