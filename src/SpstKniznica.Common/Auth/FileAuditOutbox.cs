using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Auth;

/// <summary>
/// Single-host JSONL backlog when Admin audit HTTP ingest is down.
/// Prefer <see cref="RedisAuditOutbox"/> when Redis is available.
/// </summary>
public sealed class FileAuditOutbox : IAuditOutbox
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly string _path;
    private readonly object _gate = new();

    public FileAuditOutbox(IHostEnvironment env)
    {
        var dir = Path.Combine(env.ContentRootPath, "logs");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, "audit-outbox.jsonl");
    }

    public string Describe => _path;

    public void Enqueue(AuditEntry entry)
    {
        var line = JsonSerializer.Serialize(entry, JsonOptions);
        lock (_gate)
        {
            File.AppendAllText(_path, line + Environment.NewLine);
        }
    }

    public IReadOnlyList<AuditEntry> DequeueBatch(int max)
    {
        if (max <= 0)
        {
            return [];
        }

        lock (_gate)
        {
            var all = ReadAllUnlocked();
            if (all.Count == 0)
            {
                return [];
            }

            var batch = all.Take(max).ToList();
            ReplaceAllUnlocked(all.Skip(max).ToList());
            return batch;
        }
    }

    public void Requeue(IEnumerable<AuditEntry> entries)
    {
        foreach (var entry in entries)
        {
            Enqueue(entry);
        }
    }

    public int Count()
    {
        lock (_gate)
        {
            if (!File.Exists(_path))
            {
                return 0;
            }

            return File.ReadLines(_path).Count(l => !string.IsNullOrWhiteSpace(l));
        }
    }

    private List<AuditEntry> ReadAllUnlocked()
    {
        if (!File.Exists(_path))
        {
            return [];
        }

        var list = new List<AuditEntry>();
        foreach (var line in File.ReadAllLines(_path))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            try
            {
                var entry = JsonSerializer.Deserialize<AuditEntry>(line, JsonOptions);
                if (entry is not null)
                {
                    list.Add(entry);
                }
            }
            catch
            {
                // Drop corrupt lines on rewrite.
            }
        }

        return list;
    }

    private void ReplaceAllUnlocked(IReadOnlyList<AuditEntry> remaining)
    {
        if (remaining.Count == 0)
        {
            if (File.Exists(_path))
            {
                File.Delete(_path);
            }

            return;
        }

        var tmp = _path + ".tmp";
        File.WriteAllLines(
            tmp,
            remaining.Select(e => JsonSerializer.Serialize(e, JsonOptions)));
        File.Move(tmp, _path, overwrite: true);
    }
}

/// <summary>
/// Tries Admin HTTP first; on failure persists to <see cref="IAuditOutbox"/>.
/// </summary>
public sealed class DurableHttpAuditSink(
    HttpAdminAuditSink inner,
    IAuditOutbox outbox,
    ILogger<DurableHttpAuditSink> logger) : IAuditSink
{
    public async Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default)
    {
        try
        {
            await inner.WriteAsync(entry, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Audit HTTP failed — queued to {Sink}", outbox.Describe);
            outbox.Enqueue(entry);
        }
    }
}

/// <summary>
/// Drains <see cref="IAuditOutbox"/> back to AdminService.
/// </summary>
public sealed class AuditOutboxDispatchHostedService(
    IAuditOutbox outbox,
    IServiceScopeFactory scopeFactory,
    ILogger<AuditOutboxDispatchHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(20);
    private const int BatchSize = 50;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DrainAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Audit outbox drain failed");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task DrainAsync(CancellationToken cancellationToken)
    {
        var pending = outbox.DequeueBatch(BatchSize);
        if (pending.Count == 0)
        {
            return;
        }

        await using var scope = scopeFactory.CreateAsyncScope();
        var sink = scope.ServiceProvider.GetRequiredService<HttpAdminAuditSink>();
        var metrics = scope.ServiceProvider.GetService<RequestMetrics>();
        metrics?.SetGauge("audit_outbox_pending", outbox.Count() + pending.Count);

        var remaining = new List<AuditEntry>();
        var flushed = 0;
        foreach (var entry in pending)
        {
            try
            {
                await sink.WriteAsync(entry, cancellationToken);
                flushed++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                remaining.Add(entry);
                logger.LogDebug(ex, "Audit outbox retry still failing for {Action}", entry.Action);
            }
        }

        if (remaining.Count > 0)
        {
            outbox.Requeue(remaining);
        }

        var backlog = outbox.Count();
        metrics?.SetGauge("audit_outbox_pending", backlog);
        if (flushed > 0)
        {
            metrics?.IncrementCounter("audit_outbox_flushed", flushed);
        }

        if (backlog > 100)
        {
            logger.LogError(
                "Audit outbox backlog is large: {Count} entries in {Sink}",
                backlog,
                outbox.Describe);
        }
    }
}
