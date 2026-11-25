using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace GatewayService.Health;

/// <summary>
/// Optional Redis ping for gateway readiness (degraded when missing).
/// </summary>
public sealed class RedisReadyCheck(IConfiguration configuration) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration["Cache:ConnectionString"]
            ?? configuration["RateLimiting:RedisConnectionString"]
            ?? "localhost:6379";

        try
        {
            if (!cs.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
            {
                cs += ",abortConnect=false,connectTimeout=2000";
            }

            using var mux = ConnectionMultiplexer.Connect(cs);
            _ = mux.GetDatabase().Ping();
            return Task.FromResult(HealthCheckResult.Healthy("Redis OK"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(
                HealthCheckResult.Degraded("Redis unreachable", ex));
        }
    }
}
