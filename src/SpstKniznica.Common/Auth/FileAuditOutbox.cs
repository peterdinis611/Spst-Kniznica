using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Auth;

/// <summary>
/// Durable JSONL backlog when Admin audit HTTP ingest is down.
/// </summary>
public sealed class FileAuditOutbox
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

    public string FilePath => _path;

    public void Enqueue(AuditEntry entry)
    {
        var line = JsonSerializer.Serialize(entry, JsonOptions);
        lock (_gate)
        {
            File.AppendAllText(_path, line + Environment.NewLine);
        }
    }

    public IReadOnlyList<AuditEntry> ReadAll()
    {
        if (!File.Exists(_path))
        {
            return [];
        }

        string[] lines;
        lock (_gate)
        {
            lines = File.ReadAllLines(_path);
        }

        var list = new List<AuditEntry>(lines.Length);
        foreach (var line in lines)
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
                // Drop corrupt lines on next rewrite.
            }
        }

        return list;
    }

    public void ReplaceAll(IReadOnlyList<AuditEntry> remaining)
    {
        lock (_gate)
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

    public int Count()
    {
        if (!File.Exists(_path))
        {
            return 0;
        }

        lock (_gate)
        {
            return File.ReadLines(_path).Count(l => !string.IsNullOrWhiteSpace(l));
        }
    }
}

/// <summary>
/// Tries Admin HTTP first; on failure persists to <see cref="FileAuditOutbox"/>.
/// </summary>
public sealed class DurableHttpAuditSink(
    HttpAdminAuditSink inner,
    FileAuditOutbox outbox,
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
            logger.LogWarning(ex, "Audit HTTP failed — queued to {Path}", outbox.FilePath);
            outbox.Enqueue(entry);
        }
    }
}

/// <summary>
/// Drains <see cref="FileAuditOutbox"/> back to AdminService.
/// </summary>
public sealed class AuditOutboxDispatchHostedService(
    FileAuditOutbox outbox,
    IServiceScopeFactory scopeFactory,
    ILogger<AuditOutboxDispatchHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(20);

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
        var pending = outbox.ReadAll();
        if (pending.Count == 0)
        {
            return;
        }

        await using var scope = scopeFactory.CreateAsyncScope();
        var sink = scope.ServiceProvider.GetRequiredService<HttpAdminAuditSink>();
        var metrics = scope.ServiceProvider.GetService<RequestMetrics>();
        metrics?.SetGauge("audit_outbox_pending", pending.Count);

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

        outbox.ReplaceAll(remaining);
        metrics?.SetGauge("audit_outbox_pending", remaining.Count);
        if (flushed > 0)
        {
            metrics?.IncrementCounter("audit_outbox_flushed", flushed);
        }

        if (remaining.Count > 100)
        {
            logger.LogError(
                "Audit outbox backlog is large: {Count} entries in {Path}",
                remaining.Count,
                outbox.FilePath);
        }
    }
}
