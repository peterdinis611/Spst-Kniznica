using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SpstKniznica.Common.Hosting;

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

        services.AddHttpClient<OpenLibraryClient>().AddSpstResilienceExternal();
        services.AddHttpClient<WorldCatClient>().AddSpstResilienceExternal();
        services.AddHttpClient<WikidataClient>(c =>
            {
                c.DefaultRequestHeaders.TryAddWithoutValidation(
                    "User-Agent",
                    "SPST-Kniznica/1.0 (school-library)");
            })
            .AddSpstResilienceExternal();
        services.AddHttpClient<NominatimClient>().AddSpstResilienceExternal();
        services.AddHttpClient<NagerDateClient>().AddSpstResilienceExternal();
        services.AddHttpClient<TurnstileVerifier>().AddSpstResilienceTight();

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
