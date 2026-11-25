using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using WorkersService.Jobs;

namespace WorkersService.Queue;

/// <summary>
/// Channel queue with JSONL persistence so pending jobs survive process restart.
/// </summary>
public sealed class FileBackedOrderJobQueue : IOrderJobQueue
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly Channel<ProcessOrderJob> _channel =
        Channel.CreateUnbounded<ProcessOrderJob>(new UnboundedChannelOptions
        {
            SingleReader = false,
            SingleWriter = false,
        });

    private readonly string _path;
    private readonly object _gate = new();
    private readonly ILogger<FileBackedOrderJobQueue> _logger;

    public FileBackedOrderJobQueue(IHostEnvironment env, ILogger<FileBackedOrderJobQueue> logger)
    {
        _logger = logger;
        var dir = Path.Combine(env.ContentRootPath, "logs");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, "order-jobs-queue.jsonl");
        ReloadFromDisk();
    }

    public int PendingCount => _channel.Reader.Count;

    public ValueTask<ProcessOrderJob> EnqueueAsync(
        string orderId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(orderId);

        var normalized = orderId.Trim();
        var job = new ProcessOrderJob($"order-{normalized}", normalized);
        PersistAppend(job);
        if (!_channel.Writer.TryWrite(job))
        {
            throw new InvalidOperationException("Order job queue rejected the write.");
        }

        return ValueTask.FromResult(job);
    }

    public async IAsyncEnumerable<ProcessOrderJob> ReadAllAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var job in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            RemoveFromDisk(job);
            yield return job;
        }
    }

    private void ReloadFromDisk()
    {
        if (!File.Exists(_path))
        {
            return;
        }

        string[] lines;
        lock (_gate)
        {
            lines = File.ReadAllLines(_path);
        }

        var restored = 0;
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            try
            {
                var job = JsonSerializer.Deserialize<ProcessOrderJob>(line, JsonOptions);
                if (job is null || string.IsNullOrWhiteSpace(job.OrderId))
                {
                    continue;
                }

                if (_channel.Writer.TryWrite(job))
                {
                    restored++;
                }
            }
            catch
            {
                // Skip corrupt lines.
            }
        }

        if (restored > 0)
        {
            _logger.LogInformation("Restored {Count} order jobs from {Path}", restored, _path);
        }
    }

    private void PersistAppend(ProcessOrderJob job)
    {
        var line = JsonSerializer.Serialize(job, JsonOptions);
        lock (_gate)
        {
            File.AppendAllText(_path, line + Environment.NewLine);
        }
    }

    private void RemoveFromDisk(ProcessOrderJob completed)
    {
        lock (_gate)
        {
            if (!File.Exists(_path))
            {
                return;
            }

            var remaining = File.ReadAllLines(_path)
                .Where(line =>
                {
                    if (string.IsNullOrWhiteSpace(line))
                    {
                        return false;
                    }

                    try
                    {
                        var job = JsonSerializer.Deserialize<ProcessOrderJob>(line, JsonOptions);
                        return job is not null
                            && !string.Equals(job.JobId, completed.JobId, StringComparison.Ordinal);
                    }
                    catch
                    {
                        return false;
                    }
                })
                .ToArray();

            if (remaining.Length == 0)
            {
                File.Delete(_path);
            }
            else
            {
                File.WriteAllLines(_path, remaining);
            }
        }
    }
}
