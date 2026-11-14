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

    private sealed record CorsStartupGuard(
        bool ConfiguredAllowAnyOrigin,
        bool EffectiveAllowAnyOrigin,
        string EnvironmentName);
}
