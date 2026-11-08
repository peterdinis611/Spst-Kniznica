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

        var enabled = configuration.GetValue($"{CacheOptions.SectionName}:Enabled", true);
        if (!enabled)
        {
            services.AddSingleton<IAppCache, NullAppCache>();
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
