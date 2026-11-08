using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace SpstKniznica.Caching;

public sealed class RedisAppCache : IAppCache
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IConnectionMultiplexer _mux;
    private readonly CacheOptions _options;
    private readonly ILogger<RedisAppCache> _logger;

    public bool IsEnabled => true;

    public RedisAppCache(
        IConnectionMultiplexer mux,
        IOptions<CacheOptions> options,
        ILogger<RedisAppCache> logger)
    {
        _mux = mux;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var db = _mux.GetDatabase();
        var value = await db.StringGetAsync(Prefixed(key));
        if (value.IsNullOrEmpty)
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>((string)value!, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize cache key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
    {
        var db = _mux.GetDatabase();
        var payload = JsonSerializer.Serialize(value, JsonOptions);
        var expiry = ttl ?? TimeSpan.FromSeconds(_options.DefaultTtlSeconds);
        await db.StringSetAsync(Prefixed(key), payload, expiry);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        var db = _mux.GetDatabase();
        await db.KeyDeleteAsync(Prefixed(key));
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var pattern = Prefixed(prefix) + "*";
        var keys = await ScanKeysAsync(pattern, cancellationToken);
        if (keys.Count == 0)
        {
            return;
        }

        var db = _mux.GetDatabase();
        await db.KeyDeleteAsync(keys.Select(k => (RedisKey)k).ToArray());
        _logger.LogInformation("Removed {Count} cache keys matching {Prefix}", keys.Count, prefix);
    }

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
    {
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var value = await factory(cancellationToken);
        if (value is not null)
        {
            await SetAsync(key, value, ttl, cancellationToken);
        }

        return value;
    }

    public async Task<IReadOnlyList<string>> ListKeysAsync(
        string? pattern = null,
        CancellationToken cancellationToken = default)
    {
        var redisPattern = string.IsNullOrWhiteSpace(pattern)
            ? Prefixed("*")
            : Prefixed(pattern);

        var keys = await ScanKeysAsync(redisPattern, cancellationToken);
        var instance = _options.InstanceName;
        return keys
            .Select(k => k.StartsWith(instance, StringComparison.Ordinal)
                ? k[instance.Length..]
                : k)
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToList();
    }

    private async Task<List<string>> ScanKeysAsync(string pattern, CancellationToken cancellationToken)
    {
        var keys = new List<string>();
        foreach (var endpoint in _mux.GetEndPoints())
        {
            var server = _mux.GetServer(endpoint);
            if (!server.IsConnected || server.IsReplica)
            {
                continue;
            }

            await foreach (var key in server.KeysAsync(pattern: pattern).WithCancellation(cancellationToken))
            {
                keys.Add(key.ToString());
            }
        }

        return keys;
    }

    private string Prefixed(string key) => _options.InstanceName + key;
}
