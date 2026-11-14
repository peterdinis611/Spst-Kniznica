using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Integrations;

public sealed class WikidataClient(HttpClient http, ILogger<WikidataClient> logger)
{
    public async Task<AuthorEnrichmentResult?> EnrichAuthorAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var query = name.Trim();

        try
        {
            var searchUrl =
                "https://www.wikidata.org/w/api.php?action=wbsearchentities"
                + $"&search={Uri.EscapeDataString(query)}&language=sk&uselang=sk&type=item&limit=5&format=json";

            using var searchResponse = await http.GetAsync(searchUrl, cancellationToken);
            if (!searchResponse.IsSuccessStatusCode) return null;

            await using var searchStream = await searchResponse.Content.ReadAsStreamAsync(cancellationToken);
            using var searchDoc = await JsonDocument.ParseAsync(searchStream, cancellationToken: cancellationToken);
            if (!searchDoc.RootElement.TryGetProperty("search", out var results)
                || results.GetArrayLength() == 0)
            {
                return null;
            }

            var best = results[0];
            var id = best.GetProperty("id").GetString();
            var label = best.TryGetProperty("label", out var labelEl) ? labelEl.GetString() : query;
            var description = best.TryGetProperty("description", out var descEl) ? descEl.GetString() : null;
            if (string.IsNullOrWhiteSpace(id)) return null;

            string? viaf = null;
            string? nationality = null;
            int? birthYear = null;

            var entityUrl =
                $"https://www.wikidata.org/wiki/Special:EntityData/{id}.json";
            using var entityResponse = await http.GetAsync(entityUrl, cancellationToken);
            if (entityResponse.IsSuccessStatusCode)
            {
                await using var entityStream = await entityResponse.Content.ReadAsStreamAsync(cancellationToken);
                using var entityDoc = await JsonDocument.ParseAsync(entityStream, cancellationToken: cancellationToken);
                if (entityDoc.RootElement.TryGetProperty("entities", out var entities)
                    && entities.TryGetProperty(id, out var entity)
                    && entity.TryGetProperty("claims", out var claims))
                {
                    viaf = FirstStringClaim(claims, "P214");
                    birthYear = ParseYear(FirstTimeClaim(claims, "P569"));
                    nationality = FirstStringClaim(claims, "P27"); // often Q-id; keep if readable
                    if (nationality is { Length: > 0 } && nationality.StartsWith('Q'))
                    {
                        nationality = null; // avoid raw QIDs in UI
                    }
                }
            }

            return new AuthorEnrichmentResult
            {
                Query = query,
                Name = label,
                Biography = description,
                Nationality = nationality,
                BirthYear = birthYear,
                WikidataId = id,
                ViafId = viaf,
                ProfileUrl = viaf is not null
                    ? $"https://viaf.org/viaf/{viaf}/"
                    : $"https://www.wikidata.org/wiki/{id}",
                Source = "Wikidata",
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Wikidata enrich failed for {Name}", query);
            return null;
        }
    }

    private static string? FirstStringClaim(JsonElement claims, string property)
    {
        if (!claims.TryGetProperty(property, out var arr) || arr.GetArrayLength() == 0) return null;
        var mainsnak = arr[0].GetProperty("mainsnak");
        if (!mainsnak.TryGetProperty("datavalue", out var dv)) return null;
        if (!dv.TryGetProperty("value", out var value)) return null;
        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static string? FirstTimeClaim(JsonElement claims, string property)
    {
        if (!claims.TryGetProperty(property, out var arr) || arr.GetArrayLength() == 0) return null;
        var mainsnak = arr[0].GetProperty("mainsnak");
        if (!mainsnak.TryGetProperty("datavalue", out var dv)) return null;
        if (!dv.TryGetProperty("value", out var value)) return null;
        if (value.ValueKind == JsonValueKind.Object && value.TryGetProperty("time", out var time))
        {
            return time.GetString();
        }

        return null;
    }

    private static int? ParseYear(string? wikidataTime)
    {
        // format: +1950-01-01T00:00:00Z
        if (string.IsNullOrWhiteSpace(wikidataTime)) return null;
        var digits = new string(wikidataTime.TrimStart('+').Where(char.IsDigit).Take(4).ToArray());
        return int.TryParse(digits, out var y) && y is >= 1 and <= 2100 ? y : null;
    }
}
