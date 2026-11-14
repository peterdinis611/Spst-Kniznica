using System.Threading.RateLimiting;
using StackExchange.Redis;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Fixed-window limiter backed by Redis INCR/EXPIRE — shared across process instances.
/// </summary>
internal sealed class RedisFixedWindowRateLimiter : RateLimiter
{
    private readonly IDatabase _db;
    private readonly string _key;
    private readonly int _permitLimit;
    private readonly TimeSpan _window;
    private int _lastCount;

    public RedisFixedWindowRateLimiter(
        IConnectionMultiplexer multiplexer,
        string partitionKey,
        int permitLimit,
        TimeSpan window)
    {
        _db = multiplexer.GetDatabase();
        _key = "rl:" + partitionKey;
        _permitLimit = Math.Max(1, permitLimit);
        _window = window <= TimeSpan.Zero ? TimeSpan.FromSeconds(60) : window;
    }

    public override TimeSpan? IdleDuration => null;

    public override RateLimiterStatistics? GetStatistics()
        => new()
        {
            CurrentAvailablePermits = Math.Max(0, _permitLimit - _lastCount),
            CurrentQueuedCount = 0,
            TotalFailedLeases = 0,
            TotalSuccessfulLeases = 0,
        };

    protected override ValueTask<RateLimitLease> AcquireAsyncCore(
        int permitCount,
        CancellationToken cancellationToken)
    {
        if (permitCount > _permitLimit)
        {
            return ValueTask.FromResult<RateLimitLease>(new RedisLease(false, _window));
        }

        try
        {
            var count = (int)_db.StringIncrement(_key);
            _lastCount = count;
            if (count == 1)
            {
                _db.KeyExpire(_key, _window);
            }

            if (count > _permitLimit)
            {
                var ttl = _db.KeyTimeToLive(_key) ?? _window;
                return ValueTask.FromResult<RateLimitLease>(new RedisLease(false, ttl));
            }

            return ValueTask.FromResult<RateLimitLease>(new RedisLease(true, TimeSpan.Zero));
        }
        catch
        {
            // Fail open if Redis is down — prefer availability over hard lockout.
            return ValueTask.FromResult<RateLimitLease>(new RedisLease(true, TimeSpan.Zero));
        }
    }

    protected override RateLimitLease AttemptAcquireCore(int permitCount)
        => AcquireAsyncCore(permitCount, CancellationToken.None).AsTask().GetAwaiter().GetResult();

    private sealed class RedisLease(bool isAcquired, TimeSpan retryAfter) : RateLimitLease
    {
        public override bool IsAcquired { get; } = isAcquired;

        public override IEnumerable<string> MetadataNames
            => retryAfter > TimeSpan.Zero ? [MetadataName.RetryAfter.Name] : [];

        public override bool TryGetMetadata(string metadataName, out object? metadata)
        {
            if (metadataName == MetadataName.RetryAfter.Name && retryAfter > TimeSpan.Zero)
            {
                metadata = retryAfter;
                return true;
            }

            metadata = null;
            return false;
        }
    }
}
