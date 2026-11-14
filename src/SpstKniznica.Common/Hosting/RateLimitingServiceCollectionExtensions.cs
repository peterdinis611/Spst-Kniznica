using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace SpstKniznica.Common.Hosting;

public static class RateLimitingServiceCollectionExtensions
{
    public const string PublicReadPolicy = "public-read";
    public const string SensitiveWritePolicy = "sensitive-write";
    public const string DataExportPolicy = "data-export";

    public static IServiceCollection AddSpstApiRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<RateLimitingOptions>(configuration.GetSection(RateLimitingOptions.SectionName));
        var settings = configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
            ?? new RateLimitingOptions();

        IConnectionMultiplexer? redis = null;
        if (settings.UseRedis)
        {
            var redisCs = settings.RedisConnectionString
                ?? configuration["Cache:ConnectionString"]
                ?? "localhost:6379";
            if (!redisCs.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
            {
                redisCs += ",abortConnect=false,connectTimeout=2000";
            }

            try
            {
                redis = ConnectionMultiplexer.Connect(redisCs);
                services.AddSingleton(redis);
            }
            catch
            {
                redis = null;
            }
        }

        var redisRef = redis;

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

                    return CreatePartition(
                        redisRef,
                        "g:" + GetClientKey(httpContext),
                        settings.GlobalPermitLimit,
                        TimeSpan.FromSeconds(Math.Max(1, settings.GlobalWindowSeconds)));
                });
            }

            options.AddPolicy(PublicReadPolicy, httpContext =>
                CreatePartition(
                    redisRef,
                    "r:" + GetClientKey(httpContext),
                    settings.PublicReadPermitLimit,
                    TimeSpan.FromSeconds(Math.Max(1, settings.PublicReadWindowSeconds))));

            options.AddPolicy(SensitiveWritePolicy, httpContext =>
                CreatePartition(
                    redisRef,
                    "w:" + GetClientKey(httpContext),
                    settings.SensitiveWritePermitLimit,
                    TimeSpan.FromSeconds(Math.Max(1, settings.SensitiveWriteWindowSeconds))));

            options.AddPolicy(DataExportPolicy, httpContext =>
                CreatePartition(
                    redisRef,
                    "x:" + GetClientKey(httpContext),
                    settings.DataExportPermitLimit,
                    TimeSpan.FromSeconds(Math.Max(1, settings.DataExportWindowSeconds))));
        });

        return services;
    }

    public static IServiceCollection AddSpstApiRateLimiting(this IServiceCollection services)
        => services.AddSpstApiRateLimiting(new ConfigurationBuilder().Build());

    public static IApplicationBuilder UseSpstRateLimiting(this IApplicationBuilder app)
        => app.UseRateLimiter();

    private static RateLimitPartition<string> CreatePartition(
        IConnectionMultiplexer? redis,
        string key,
        int permitLimit,
        TimeSpan window)
    {
        if (redis is { IsConnected: true })
        {
            var mux = redis;
            var limit = permitLimit;
            var win = window;
            return RateLimitPartition.Get(
                key,
                k => new RedisFixedWindowRateLimiter(mux, k, limit, win));
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            key,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = Math.Max(1, permitLimit),
                Window = window,
                QueueLimit = 0,
                AutoReplenishment = true,
            });
    }

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
