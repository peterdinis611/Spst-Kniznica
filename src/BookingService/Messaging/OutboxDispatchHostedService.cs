using BookingService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
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

        var pending = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.AttemptCount < MaxAttempts)
            .OrderBy(m => m.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        if (pending.Count == 0)
        {
            return;
        }

        foreach (var row in pending)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var evt = EventJson.DeserializeByTypeName(row.EventType, row.Payload);
            if (evt is null)
            {
                row.AttemptCount = MaxAttempts;
                row.LastError = $"Unsupported EventType '{row.EventType}'";
                continue;
            }

            try
            {
                await publisher.PublishAsync(evt, cancellationToken);
                row.ProcessedAt = DateTimeOffset.UtcNow;
                row.LastError = null;
                row.AttemptCount += 1;
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
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
