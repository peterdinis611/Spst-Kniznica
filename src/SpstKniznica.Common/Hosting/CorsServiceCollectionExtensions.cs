using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Hosting;

public static class CorsServiceCollectionExtensions
{
    public static IServiceCollection AddSpstCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));
        var cors = configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();
        cors.AllowedOrigins = MergeSiteUrlOrigins(cors.AllowedOrigins, cors.SiteUrl, configuration);

        // AllowAnyOrigin is development-only — ignore it outside Development even if configured.
        var allowAnyOrigin = cors.AllowAnyOrigin && environment.IsDevelopment();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsOptions.PolicyName, policy =>
            {
                if (allowAnyOrigin)
                {
                    policy.AllowAnyOrigin();
                }
                else
                {
                    policy.WithOrigins(cors.AllowedOrigins);
                    if (cors.AllowCredentials)
                    {
                        policy.AllowCredentials();
                    }
                }

                if (cors.AllowedMethods is { Length: > 0 })
                {
                    policy.WithMethods(cors.AllowedMethods);
                }
                else
                {
                    policy.AllowAnyMethod();
                }

                if (cors.AllowedHeaders is { Length: > 0 })
                {
                    policy.WithHeaders(cors.AllowedHeaders);
                }
                else
                {
                    policy.AllowAnyHeader();
                }
            });
        });

        services.AddSingleton(new CorsStartupGuard(cors.AllowAnyOrigin, allowAnyOrigin, environment.EnvironmentName));

        return services;
    }

    public static IApplicationBuilder UseSpstCors(this IApplicationBuilder app)
    {
        var guard = app.ApplicationServices.GetService<CorsStartupGuard>();
        var logger = app.ApplicationServices.GetService<ILoggerFactory>()
            ?.CreateLogger("SpstKniznica.Cors");

        if (guard is { ConfiguredAllowAnyOrigin: true, EffectiveAllowAnyOrigin: false })
        {
            logger?.LogWarning(
                "Cors:AllowAnyOrigin was configured true but is ignored outside Development ({Environment}). Using AllowedOrigins instead.",
                guard.EnvironmentName);
        }

        return app.UseCors(CorsOptions.PolicyName);
    }

    /// <summary>
    /// Production catalog direct calls need the public school URL in CORS.
    /// Honours Cors:SiteUrl, SITE_URL, and NEXT_PUBLIC_SITE_URL.
    /// </summary>
    internal static string[] MergeSiteUrlOrigins(
        string[] configured,
        string? siteUrl,
        IConfiguration configuration)
    {
        var extras = new[]
        {
            siteUrl,
            configuration["Cors:SiteUrl"],
            configuration["SITE_URL"],
            configuration["NEXT_PUBLIC_SITE_URL"],
            Environment.GetEnvironmentVariable("SITE_URL"),
            Environment.GetEnvironmentVariable("NEXT_PUBLIC_SITE_URL"),
        };

        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var origin in configured ?? [])
        {
            if (!string.IsNullOrWhiteSpace(origin))
            {
                set.Add(origin.Trim().TrimEnd('/'));
            }
        }

        foreach (var raw in extras)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                continue;
            }

            var trimmed = raw.Trim().TrimEnd('/');
            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            {
                set.Add($"{uri.Scheme}://{uri.Authority}");
            }
        }

        return set.Count == 0 ? configured ?? [] : set.ToArray();
    }

    private sealed record CorsStartupGuard(
        bool ConfiguredAllowAnyOrigin,
        bool EffectiveAllowAnyOrigin,
        string EnvironmentName);
}
