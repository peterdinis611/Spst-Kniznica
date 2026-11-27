using System.Runtime.CompilerServices;
using System.Text.Json;
using StackExchange.Redis;
using WorkersService.Jobs;

namespace WorkersService.Queue;

/// <summary>
/// Multi-host order job queue backed by a Redis list (AOF recommended).
/// </summary>
public sealed class RedisOrderJobQueue : IOrderJobQueue
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IDatabase _db;
    private readonly string _key;
    private readonly ILogger<RedisOrderJobQueue> _logger;

    public RedisOrderJobQueue(
        IConnectionMultiplexer mux,
        ILogger<RedisOrderJobQueue> logger,
        string key = "spst:order-jobs")
    {
        _db = mux.GetDatabase();
        _key = string.IsNullOrWhiteSpace(key) ? "spst:order-jobs" : key.Trim();
        _logger = logger;
        _logger.LogInformation("Order job queue using Redis list {Key}", _key);
    }

    public int PendingCount => (int)Math.Min(int.MaxValue, _db.ListLength(_key));

    public ValueTask<ProcessOrderJob> EnqueueAsync(
        string orderId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(orderId);

        var normalized = orderId.Trim();
        var job = new ProcessOrderJob($"order-{normalized}", normalized);
        var payload = JsonSerializer.Serialize(job, JsonOptions);
        _db.ListLeftPush(_key, payload);
        return ValueTask.FromResult(job);
    }

    public async IAsyncEnumerable<ProcessOrderJob> ReadAllAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            RedisValue value;
            try
            {
                value = await _db.ListRightPopAsync(_key);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Redis order queue pop failed");
                await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
                continue;
            }

            if (value.IsNullOrEmpty)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(400), cancellationToken);
                continue;
            }

            ProcessOrderJob? job = null;
            try
            {
                job = JsonSerializer.Deserialize<ProcessOrderJob>((string)value!, JsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Corrupt order job payload dropped");
            }

            if (job is null || string.IsNullOrWhiteSpace(job.OrderId))
            {
                continue;
            }

            yield return job;
        }
    }
}
