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

        return await CacheSingleFlight.RunAsync(
            Prefixed(key),
            async ct =>
            {
                var again = await GetAsync<T>(key, ct);
                if (again is not null)
                {
                    return again;
                }

                await using var lease = await TryAcquireFillLockAsync(key, ct);
                again = await GetAsync<T>(key, ct);
                if (again is not null)
                {
                    return again;
                }

                var value = await factory(ct);
                if (value is not null)
                {
                    await SetAsync(key, value, ttl, ct);
                }

                return value;
            },
            cancellationToken);
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

    private async Task<IAsyncDisposable> TryAcquireFillLockAsync(string key, CancellationToken cancellationToken)
    {
        var db = _mux.GetDatabase();
        var lockKey = Prefixed("lock:fill:" + key);
        var token = Guid.NewGuid().ToString("N");
        for (var attempt = 0; attempt < 25; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (await db.StringSetAsync(lockKey, token, TimeSpan.FromSeconds(8), When.NotExists))
            {
                return new RedisLockLease(db, lockKey, token);
            }

            await Task.Delay(40 + (attempt * 10), cancellationToken);
        }

        // Timed out waiting — compute without exclusive lock (still process-local single-flight).
        return NoopLease.Instance;
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

    private sealed class RedisLockLease(IDatabase db, RedisKey key, string token) : IAsyncDisposable
    {
        private static readonly LuaScript Release = LuaScript.Prepare(
            """
            if redis.call('get', @key) == @token then
              return redis.call('del', @key)
            end
            return 0
            """);

        public async ValueTask DisposeAsync()
        {
            try
            {
                await db.ScriptEvaluateAsync(Release, new { key, token });
            }
            catch
            {
                // Lock TTL will expire.
            }
        }
    }

    private sealed class NoopLease : IAsyncDisposable
    {
        public static readonly NoopLease Instance = new();

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
