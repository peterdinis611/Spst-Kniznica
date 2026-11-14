using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Integrations;

public sealed class PublicHoliday
{
    public DateOnly Date { get; init; }
    public string LocalName { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public sealed class NagerDateClient(
    HttpClient http,
    IMemoryCache cache,
    ILogger<NagerDateClient> logger)
{
    public async Task<IReadOnlyList<PublicHoliday>> GetHolidaysAsync(
        int year,
        string countryCode = "SK",
        CancellationToken cancellationToken = default)
    {
        var key = $"nager:list:{countryCode}:{year}";
        if (cache.TryGetValue(key, out List<PublicHoliday>? cached) && cached is not null)
        {
            return cached;
        }

        try
        {
            var url = $"https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}";
            var items = await http.GetFromJsonAsync<List<NagerHolidayDto>>(url, cancellationToken)
                        ?? [];
            var list = items
                .Select(h => new PublicHoliday
                {
                    Date = DateOnly.FromDateTime(h.Date.Date),
                    LocalName = string.IsNullOrWhiteSpace(h.LocalName) ? h.Name : h.LocalName,
                    Name = h.Name,
                })
                .ToList();
            cache.Set(key, list, TimeSpan.FromHours(12));
            return list;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Nager.Date holidays failed for {Country}/{Year}", countryCode, year);
            var empty = new List<PublicHoliday>();
            cache.Set(key, empty, TimeSpan.FromMinutes(15));
            return empty;
        }
    }

    public async Task<IReadOnlySet<DateOnly>> GetHolidayDatesAsync(
        int year,
        string countryCode = "SK",
        CancellationToken cancellationToken = default)
    {
        var list = await GetHolidaysAsync(year, countryCode, cancellationToken);
        return list.Select(h => h.Date).ToHashSet();
    }

    public async Task<bool> IsPublicHolidayAsync(
        DateOnly date,
        string countryCode = "SK",
        CancellationToken cancellationToken = default)
    {
        var set = await GetHolidayDatesAsync(date.Year, countryCode, cancellationToken);
        return set.Contains(date);
    }

    private sealed class NagerHolidayDto
    {
        public DateTime Date { get; set; }
        public string LocalName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}
