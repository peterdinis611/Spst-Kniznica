using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SpstKniznica.Common.Hosting;

public static class RateLimitingServiceCollectionExtensions
{
    public const string PublicReadPolicy = "public-read";
    public const string SensitiveWritePolicy = "sensitive-write";

    public static IServiceCollection AddSpstApiRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<RateLimitingOptions>(configuration.GetSection(RateLimitingOptions.SectionName));
        var settings = configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
            ?? new RateLimitingOptions();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, token) =>
            {
                var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ra)
                    ? (int)Math.Ceiling(ra.TotalSeconds)
                    : Math.Max(settings.GlobalWindowSeconds, settings.SensitiveWriteWindowSeconds);

                context.HttpContext.Response.Headers.RetryAfter = retryAfter.ToString();
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new
                    {
                        title = "Too Many Requests",
                        status = StatusCodes.Status429TooManyRequests,
                        detail = "Prekročený limit požiadaviek. Skús to o chvíľu znova.",
                        retryAfterSeconds = retryAfter,
                    },
                    cancellationToken: token);
            };

            if (settings.EnableGlobalLimiter)
            {
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                {
                    if (IsExemptPath(httpContext.Request.Path))
                    {
                        return RateLimitPartition.GetNoLimiter("exempt");
                    }

                    return RateLimitPartition.GetFixedWindowLimiter(
                        GetClientKey(httpContext),
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = Math.Max(1, settings.GlobalPermitLimit),
                            Window = TimeSpan.FromSeconds(Math.Max(1, settings.GlobalWindowSeconds)),
                            QueueLimit = 0,
                            AutoReplenishment = true,
                        });
                });
            }

            options.AddPolicy(PublicReadPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    GetClientKey(httpContext),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = Math.Max(1, settings.PublicReadPermitLimit),
                        Window = TimeSpan.FromSeconds(Math.Max(1, settings.PublicReadWindowSeconds)),
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    }));

            options.AddPolicy(SensitiveWritePolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    GetClientKey(httpContext),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = Math.Max(1, settings.SensitiveWritePermitLimit),
                        Window = TimeSpan.FromSeconds(Math.Max(1, settings.SensitiveWriteWindowSeconds)),
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    }));
        });

        return services;
    }

    /// <summary>Backward-compatible overload (default options). </summary>
    public static IServiceCollection AddSpstApiRateLimiting(this IServiceCollection services)
        => services.AddSpstApiRateLimiting(new ConfigurationBuilder().Build());

    public static IApplicationBuilder UseSpstRateLimiting(this IApplicationBuilder app)
        => app.UseRateLimiter();

    private static bool IsExemptPath(PathString path)
        => path.StartsWithSegments("/health")
           || path.StartsWithSegments("/swagger")
           || path.Value?.EndsWith("/swagger/v1/swagger.json", StringComparison.OrdinalIgnoreCase) == true;

    private static string GetClientKey(HttpContext httpContext)
    {
        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            return "u:" + (
                httpContext.User.FindFirst("oid")?.Value
                ?? httpContext.User.Identity.Name
                ?? "auth");
        }

        var forwarded = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            return "ip:" + forwarded.Split(',')[0].Trim();
        }

        return "ip:" + (httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
    }
}
