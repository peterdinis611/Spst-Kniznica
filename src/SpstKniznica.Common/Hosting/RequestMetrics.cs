using System.Collections.Concurrent;
using System.Diagnostics;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Lightweight in-process request counters for /metrics (no Prometheus dependency).
/// </summary>
public sealed class RequestMetrics
{
    private long _total;
    private long _status2xx;
    private long _status4xx;
    private long _status429;
    private long _status5xx;
    private long _durationMsTotal;
    private readonly ConcurrentDictionary<string, long> _byPath = new(StringComparer.OrdinalIgnoreCase);
    private readonly DateTimeOffset _startedAt = DateTimeOffset.UtcNow;

    public void Record(string path, int statusCode, long durationMs)
    {
        Interlocked.Increment(ref _total);
        Interlocked.Add(ref _durationMsTotal, Math.Max(0, durationMs));

        switch (statusCode)
        {
            case >= 200 and < 300:
                Interlocked.Increment(ref _status2xx);
                break;
            case 429:
                Interlocked.Increment(ref _status429);
                Interlocked.Increment(ref _status4xx);
                break;
            case >= 400 and < 500:
                Interlocked.Increment(ref _status4xx);
                break;
            case >= 500:
                Interlocked.Increment(ref _status5xx);
                break;
        }

        var key = NormalizePath(path);
        _byPath.AddOrUpdate(key, 1, static (_, n) => n + 1);
    }

    public object Snapshot(string serviceName) => new
    {
        service = serviceName,
        startedAt = _startedAt,
        uptimeSeconds = (long)(DateTimeOffset.UtcNow - _startedAt).TotalSeconds,
        process = new
        {
            workingSetBytes = Process.GetCurrentProcess().WorkingSet64,
            threadCount = Process.GetCurrentProcess().Threads.Count,
        },
        http = new
        {
            total = Interlocked.Read(ref _total),
            status2xx = Interlocked.Read(ref _status2xx),
            status4xx = Interlocked.Read(ref _status4xx),
            status429 = Interlocked.Read(ref _status429),
            status5xx = Interlocked.Read(ref _status5xx),
            avgDurationMs = AvgDuration(),
            topPaths = _byPath
                .OrderByDescending(kv => kv.Value)
                .Take(15)
                .Select(kv => new { path = kv.Key, count = kv.Value }),
        },
    };

    private double AvgDuration()
    {
        var total = Interlocked.Read(ref _total);
        if (total == 0)
        {
            return 0;
        }

        return Math.Round(Interlocked.Read(ref _durationMsTotal) / (double)total, 2);
    }

    private static string NormalizePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return "/";
        }

        var p = path.Split('?', 2)[0];
        if (p.Length > 64)
        {
            p = p[..64];
        }

        return p;
    }
}
