using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Caching;

/// <summary>
/// Process-local cache used when Redis is disabled (typical Development).
/// </summary>
public sealed class MemoryAppCache : IAppCache
{
    private readonly IMemoryCache _cache;
    private readonly CacheOptions _options;
    private readonly ILogger<MemoryAppCache> _logger;
    private readonly ConcurrentDictionary<string, byte> _keys = new(StringComparer.Ordinal);

    public bool IsEnabled => true;

    public MemoryAppCache(
        IMemoryCache cache,
        IOptions<CacheOptions> options,
        ILogger<MemoryAppCache> logger)
    {
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(Prefixed(key), out T? value))
        {
            return Task.FromResult(value);
        }

        return Task.FromResult<T?>(default);
    }

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
    {
        var expiry = ttl ?? TimeSpan.FromSeconds(_options.DefaultTtlSeconds);
        _cache.Set(Prefixed(key), value, expiry);
        _keys[key] = 0;
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _cache.Remove(Prefixed(key));
        _keys.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var removed = 0;
        foreach (var key in _keys.Keys)
        {
            if (!key.StartsWith(prefix, StringComparison.Ordinal))
            {
                continue;
            }

            _cache.Remove(Prefixed(key));
            if (_keys.TryRemove(key, out _))
            {
                removed++;
            }
        }

        if (removed > 0)
        {
            _logger.LogInformation("Removed {Count} memory cache keys matching {Prefix}", removed, prefix);
        }

        return Task.CompletedTask;
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

    public Task<IReadOnlyList<string>> ListKeysAsync(
        string? pattern = null,
        CancellationToken cancellationToken = default)
    {
        IEnumerable<string> keys = _keys.Keys;
        if (!string.IsNullOrWhiteSpace(pattern))
        {
            var needle = pattern.TrimEnd('*');
            keys = keys.Where(k => k.StartsWith(needle, StringComparison.Ordinal));
        }

        return Task.FromResult<IReadOnlyList<string>>(
            keys.OrderBy(k => k, StringComparer.Ordinal).ToList());
    }

    private string Prefixed(string key) => _options.InstanceName + key;
}
