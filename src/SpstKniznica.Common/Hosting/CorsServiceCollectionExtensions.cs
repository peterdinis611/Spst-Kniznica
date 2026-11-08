using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SpstKniznica.Common.Hosting;

public static class CorsServiceCollectionExtensions
{
    public static IServiceCollection AddSpstCors(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));
        var cors = configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsOptions.PolicyName, policy =>
            {
                if (cors.AllowAnyOrigin)
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

        return services;
    }

    public static IApplicationBuilder UseSpstCors(this IApplicationBuilder app)
        => app.UseCors(CorsOptions.PolicyName);
}
