using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SpstKniznica.Common.Integrations;

public static class IntegrationsServiceCollectionExtensions
{
    public static IServiceCollection AddSpstIntegrations(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddMemoryCache();
        services.Configure<WorldCatOptions>(configuration.GetSection(WorldCatOptions.SectionName));
        services.Configure<TurnstileOptions>(configuration.GetSection(TurnstileOptions.SectionName));

        services.AddHttpClient<OpenLibraryClient>(c => c.Timeout = TimeSpan.FromSeconds(8));
        services.AddHttpClient<WorldCatClient>(c => c.Timeout = TimeSpan.FromSeconds(8));
        services.AddHttpClient<WikidataClient>(c =>
        {
            c.Timeout = TimeSpan.FromSeconds(8);
            c.DefaultRequestHeaders.TryAddWithoutValidation(
                "User-Agent",
                "SPST-Kniznica/1.0 (school-library)");
        });
        services.AddHttpClient<NominatimClient>(c => c.Timeout = TimeSpan.FromSeconds(8));
        services.AddHttpClient<NagerDateClient>(c => c.Timeout = TimeSpan.FromSeconds(8));
        services.AddHttpClient<TurnstileVerifier>(c => c.Timeout = TimeSpan.FromSeconds(5));

        services.AddSingleton<IsbnCatalogLookup>();
        return services;
    }
}

/// <summary>Open Library first, optional WorldCat fallback.</summary>
public sealed class IsbnCatalogLookup(OpenLibraryClient openLibrary, WorldCatClient worldCat)
{
    public async Task<IsbnLookupResult?> LookupAsync(string isbn, CancellationToken cancellationToken = default)
    {
        var primary = await openLibrary.LookupByIsbnAsync(isbn, cancellationToken);
        if (primary is not null) return primary;
        return await worldCat.LookupByIsbnAsync(isbn, cancellationToken);
    }
}
