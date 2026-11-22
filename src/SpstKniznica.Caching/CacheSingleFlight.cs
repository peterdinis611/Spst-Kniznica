using System.Collections.Concurrent;

namespace SpstKniznica.Caching;

/// <summary>
/// Coalesce concurrent cache fills for the same key inside one process.
/// </summary>
internal static class CacheSingleFlight
{
    private static readonly ConcurrentDictionary<string, Lazy<Task<object?>>> Inflight =
        new(StringComparer.Ordinal);

    public static async Task<T> RunAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        CancellationToken cancellationToken)
    {
        var lazy = Inflight.GetOrAdd(
            key,
            static (_, state) => new Lazy<Task<object?>>(
                () => InvokeAsync(state.Factory, state.Token),
                LazyThreadSafetyMode.ExecutionAndPublication),
            (Factory: factory, Token: cancellationToken));

        try
        {
            var result = await lazy.Value.WaitAsync(cancellationToken).ConfigureAwait(false);
            return (T)result!;
        }
        finally
        {
            Inflight.TryRemove(new KeyValuePair<string, Lazy<Task<object?>>>(key, lazy));
        }
    }

    private static async Task<object?> InvokeAsync<T>(
        Func<CancellationToken, Task<T>> factory,
        CancellationToken cancellationToken)
    {
        var value = await factory(cancellationToken).ConfigureAwait(false);
        return value;
    }
}
