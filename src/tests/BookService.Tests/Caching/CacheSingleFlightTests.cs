using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SpstKniznica.Caching;

namespace BookService.Tests.Caching;

public class CacheSingleFlightTests
{
    [Fact]
    public async Task Memory_GetOrSet_runs_factory_once_under_contention()
    {
        var cache = new MemoryAppCache(
            new MemoryCache(new MemoryCacheOptions()),
            Options.Create(new CacheOptions { InstanceName = "t:", DefaultTtlSeconds = 60 }),
            NullLogger<MemoryAppCache>.Instance);

        var calls = 0;
        var tasks = Enumerable.Range(0, 20).Select(_ =>
            cache.GetOrSetAsync(
                "books:list:demo",
                async ct =>
                {
                    Interlocked.Increment(ref calls);
                    await Task.Delay(40, ct);
                    return new { n = 1 };
                },
                TimeSpan.FromSeconds(20)));

        var results = await Task.WhenAll(tasks);
        results.Should().OnlyContain(r => r.n == 1);
        calls.Should().Be(1);
    }
}
