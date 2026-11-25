using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace SpstKniznica.Caching;

public static class CachingServiceCollectionExtensions
{
    public static IServiceCollection AddSpstCaching(
        this IServiceCollection services,
        IConfiguration configuration,
        string? instanceName = null)
    {
        services.Configure<CacheOptions>(configuration.GetSection(CacheOptions.SectionName));

        if (!string.IsNullOrWhiteSpace(instanceName))
        {
            services.PostConfigure<CacheOptions>(options => options.InstanceName = instanceName);
        }

        // Cache:Enabled=false → in-process memory (dev-friendly).
        var options = configuration.GetSection(CacheOptions.SectionName).Get<CacheOptions>()
            ?? new CacheOptions();
        var useRedis = options.Enabled;
        if (!useRedis)
        {
            services.AddMemoryCache();
            services.AddSingleton<IAppCache, MemoryAppCache>();
            return services;
        }

        var connectionString = options.ConnectionString;
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = "localhost:6379";
        }

        if (!connectionString.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ",abortConnect=false,connectTimeout=5000";
        }

        IConnectionMultiplexer? multiplexer = null;
        Exception? connectError = null;
        try
        {
            multiplexer = ConnectionMultiplexer.Connect(connectionString);
            _ = multiplexer.GetDatabase().Ping();
        }
        catch (Exception ex)
        {
            connectError = ex;
            multiplexer?.Dispose();
            multiplexer = null;
        }

        if (multiplexer is null)
        {
            if (options.RequireRedis && !options.AllowMemoryFallback)
            {
                throw new InvalidOperationException(
                    "Cache:Enabled requires Redis but connection failed. " +
                    "Set Cache:AllowMemoryFallback=true for single-host emergency, " +
                    "or Cache:Enabled=false for explicit in-process cache.",
                    connectError);
            }

            services.AddMemoryCache();
            services.AddSingleton<IAppCache>(sp =>
            {
                sp.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("SpstKniznica.Caching")
                    .LogWarning(
                        connectError,
                        "Redis unavailable at startup — using in-process MemoryAppCache (split-brain risk with multiple instances)");
                return ActivatorUtilities.CreateInstance<MemoryAppCache>(sp);
            });
            return services;
        }

        services.AddSingleton<IConnectionMultiplexer>(multiplexer);
        services.AddSingleton<IAppCache, RedisAppCache>();

        return services;
    }
}
