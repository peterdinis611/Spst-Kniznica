namespace SpstKniznica.Caching;

public sealed class NullAppCache : IAppCache
{
    public bool IsEnabled => false;

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        => Task.FromResult<T?>(default);

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<T> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
        => factory(cancellationToken);

    public Task<IReadOnlyList<string>> ListKeysAsync(string? pattern = null, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<string>>([]);
}
