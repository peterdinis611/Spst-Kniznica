using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Lightweight in-process request counters for /metrics (JSON + Prometheus text).
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
    private readonly ConcurrentDictionary<string, long> _gauges = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, long> _counters = new(StringComparer.Ordinal);
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

    public void SetGauge(string name, long value)
        => _gauges.AddOrUpdate(Sanitize(name), value, (_, _) => value);

    public void IncrementCounter(string name, long delta = 1)
        => _counters.AddOrUpdate(Sanitize(name), delta, (_, n) => n + delta);

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
        gauges = _gauges.OrderBy(kv => kv.Key).ToDictionary(kv => kv.Key, kv => kv.Value),
        counters = _counters.OrderBy(kv => kv.Key).ToDictionary(kv => kv.Key, kv => kv.Value),
    };

    public string ToPrometheus(string serviceName)
    {
        var sb = new StringBuilder(1024);
        var svc = Sanitize(serviceName);
        void Line(string name, string help, string type, long value, string? extraLabels = null)
        {
            sb.Append("# HELP ").Append(name).Append(' ').Append(help).Append('\n');
            sb.Append("# TYPE ").Append(name).Append(' ').Append(type).Append('\n');
            sb.Append(name).Append("{service=\"").Append(svc).Append('"');
            if (!string.IsNullOrEmpty(extraLabels))
            {
                sb.Append(',').Append(extraLabels);
            }

            sb.Append("} ").Append(value).Append('\n');
        }

        Line("spst_http_requests_total", "Total HTTP requests", "counter", Interlocked.Read(ref _total));
        Line("spst_http_responses_2xx_total", "2xx responses", "counter", Interlocked.Read(ref _status2xx));
        Line("spst_http_responses_4xx_total", "4xx responses", "counter", Interlocked.Read(ref _status4xx));
        Line("spst_http_responses_429_total", "429 responses", "counter", Interlocked.Read(ref _status429));
        Line("spst_http_responses_5xx_total", "5xx responses", "counter", Interlocked.Read(ref _status5xx));
        Line(
            "spst_http_avg_duration_ms",
            "Average request duration in ms",
            "gauge",
            (long)Math.Round(AvgDuration()));
        Line(
            "spst_process_working_set_bytes",
            "Process working set",
            "gauge",
            Process.GetCurrentProcess().WorkingSet64);
        Line(
            "spst_uptime_seconds",
            "Process uptime",
            "gauge",
            (long)(DateTimeOffset.UtcNow - _startedAt).TotalSeconds);

        foreach (var (name, value) in _gauges.OrderBy(kv => kv.Key))
        {
            Line($"spst_custom_{name}", $"Custom gauge {name}", "gauge", value);
        }

        foreach (var (name, value) in _counters.OrderBy(kv => kv.Key))
        {
            Line($"spst_custom_{name}_total", $"Custom counter {name}", "counter", value);
        }

        return sb.ToString();
    }

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

    private static string Sanitize(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "unknown";
        }

        var sb = new StringBuilder(value.Length);
        foreach (var ch in value.Trim().ToLowerInvariant())
        {
            sb.Append(char.IsLetterOrDigit(ch) ? ch : '_');
        }

        return sb.ToString();
    }
}
