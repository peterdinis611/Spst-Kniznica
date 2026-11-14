using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Integrations;

public sealed class NominatimClient(HttpClient http, ILogger<NominatimClient> logger)
{
    public async Task<GeocodeResult?> GeocodeAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query)) return null;
        var q = query.Trim();

        try
        {
            var url =
                "https://nominatim.openstreetmap.org/search"
                + $"?q={Uri.EscapeDataString(q)}&format=json&limit=1&addressdetails=0";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            // Nominatim usage policy requires a valid User-Agent identifying the app.
            request.Headers.TryAddWithoutValidation("User-Agent", "SPST-Kniznica/1.0 (school-library; contact=admin@localhost)");
            request.Headers.TryAddWithoutValidation("Accept-Language", "sk");

            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (doc.RootElement.GetArrayLength() == 0) return null;

            var first = doc.RootElement[0];
            if (!first.TryGetProperty("lat", out var latEl) || !first.TryGetProperty("lon", out var lonEl))
            {
                return null;
            }

            if (!double.TryParse(latEl.GetString(), System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var lat)
                || !double.TryParse(lonEl.GetString(), System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var lon))
            {
                return null;
            }

            var display = first.TryGetProperty("display_name", out var dn) ? dn.GetString() : q;
            return new GeocodeResult
            {
                Query = q,
                DisplayName = display,
                Lat = lat,
                Lon = lon,
                OsmUrl =
                    $"https://www.openstreetmap.org/?mlat={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}"
                    + $"&mlon={lon.ToString(System.Globalization.CultureInfo.InvariantCulture)}#map=17/{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}/{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)}",
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Nominatim geocode failed for {Query}", q);
            return null;
        }
    }
}
