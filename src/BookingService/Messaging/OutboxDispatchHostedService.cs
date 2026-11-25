using BookingService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Messaging;

namespace BookingService.Messaging;

/// <summary>
/// Retries unpublished outbox rows (broker down / BookService briefly unavailable).
/// </summary>
public sealed class OutboxDispatchHostedService(
    IServiceScopeFactory scopeFactory,
    FanoutIntegrationEventPublisher publisher,
    ILogger<OutboxDispatchHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(15);
    private const int BatchSize = 25;
    private const int MaxAttempts = 20;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchBatchAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Outbox dispatch cycle failed");
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

    private async Task DispatchBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        var metrics = scope.ServiceProvider.GetService<RequestMetrics>();

        var pending = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.AttemptCount < MaxAttempts)
            .OrderBy(m => m.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        metrics?.SetGauge("outbox_pending", pending.Count);

        foreach (var row in pending)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var evt = EventJson.DeserializeByTypeName(row.EventType, row.Payload);
            if (evt is null)
            {
                row.AttemptCount = MaxAttempts;
                row.LastError = $"Unsupported EventType '{row.EventType}'";
                metrics?.IncrementCounter("outbox_dead_letter");
                continue;
            }

            try
            {
                await publisher.PublishAsync(evt, cancellationToken);
                row.ProcessedAt = DateTimeOffset.UtcNow;
                row.LastError = null;
                row.AttemptCount += 1;
                metrics?.IncrementCounter("outbox_published");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                row.AttemptCount += 1;
                row.LastError = ex.Message.Length > 1000 ? ex.Message[..1000] : ex.Message;
                logger.LogWarning(
                    ex,
                    "Outbox retry failed for {EventType} ({OutboxId}), attempt {Attempt}",
                    row.EventType,
                    row.Id,
                    row.AttemptCount);
                if (row.AttemptCount >= MaxAttempts)
                {
                    metrics?.IncrementCounter("outbox_dead_letter");
                    logger.LogError(
                        "Outbox dead-letter {OutboxId} ({EventType}) after {Attempts} attempts: {Error}",
                        row.Id,
                        row.EventType,
                        row.AttemptCount,
                        row.LastError);
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var dead = await db.OutboxMessages.CountAsync(
            m => m.ProcessedAt == null && m.AttemptCount >= MaxAttempts,
            cancellationToken);
        metrics?.SetGauge("outbox_dead_letter", dead);
        if (dead > 0)
        {
            logger.LogError(
                "Booking outbox has {Count} dead-letter rows (max attempts {MaxAttempts})",
                dead,
                MaxAttempts);
        }
    }
}
