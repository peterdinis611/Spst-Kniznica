using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

namespace SpstKniznica.Common.Hosting;

public static class RateLimitingServiceCollectionExtensions
{
    public const string SensitiveWritePolicy = "sensitive-write";

    public static IServiceCollection AddSpstApiRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(SensitiveWritePolicy, httpContext =>
            {
                var key = httpContext.User.Identity?.IsAuthenticated == true
                    ? httpContext.User.FindFirst("oid")?.Value
                      ?? httpContext.User.Identity?.Name
                      ?? "auth"
                    : httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon";

                return RateLimitPartition.GetFixedWindowLimiter(
                    key,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 40,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    });
            });
        });

        return services;
    }

    public static IApplicationBuilder UseSpstRateLimiting(this IApplicationBuilder app)
        => app.UseRateLimiter();
}
