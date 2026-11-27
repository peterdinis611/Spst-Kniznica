using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Shared Redis connect helper for rate limits, durable queues, and caches.
/// </summary>
public static class SpstRedisConnector
{
    public static string ResolveConnectionString(IConfiguration configuration, string? overrideCs = null)
    {
        var cs = overrideCs
            ?? configuration["RateLimiting:RedisConnectionString"]
            ?? configuration["Cache:ConnectionString"]
            ?? "localhost:6379";

        if (!cs.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
        {
            cs += ",abortConnect=false,connectTimeout=2000";
        }

        return cs;
    }

    /// <summary>
    /// Returns a live multiplexer or null when Redis is unreachable.
    /// </summary>
    public static IConnectionMultiplexer? TryConnect(
        IConfiguration configuration,
        ILogger? logger = null,
        string? overrideCs = null)
    {
        var cs = ResolveConnectionString(configuration, overrideCs);
        try
        {
            var mux = ConnectionMultiplexer.Connect(cs);
            if (!mux.IsConnected)
            {
                mux.Dispose();
                logger?.LogWarning("Redis connected but not ready ({Connection})", cs);
                return null;
            }

            _ = mux.GetDatabase().Ping();
            return mux;
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Redis unavailable ({Connection})", cs);
            return null;
        }
    }
}
