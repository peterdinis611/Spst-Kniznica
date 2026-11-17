using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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

        // Cache:Enabled=false → in-process memory (dev-friendly). true → Redis.
        var useRedis = configuration.GetValue($"{CacheOptions.SectionName}:Enabled", true);
        if (!useRedis)
        {
            services.AddMemoryCache();
            services.AddSingleton<IAppCache, MemoryAppCache>();
            return services;
        }

        var connectionString = configuration[$"{CacheOptions.SectionName}:ConnectionString"] ?? "localhost:6379";
        if (!connectionString.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ",abortConnect=false,connectTimeout=5000";
        }

        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(connectionString));
        services.AddSingleton<IAppCache, RedisAppCache>();

        return services;
    }
}
