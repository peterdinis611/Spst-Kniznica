using BookingService.Data;
using BookingService.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Messaging;

namespace BookingService.Messaging;

/// <summary>
/// Persists integration events before fan-out so broker/HTTP failures can be retried.
/// </summary>
public sealed class OutboxIntegrationEventPublisher(
    FanoutIntegrationEventPublisher inner,
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxIntegrationEventPublisher> logger) : IIntegrationEventPublisher
{
    public async Task PublishAsync<TEvent>(
        TEvent integrationEvent,
        CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        Guid outboxId;
        await using (var scope = scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
            var row = new OutboxMessage
            {
                EventType = integrationEvent.EventType,
                Payload = EventJson.Serialize(integrationEvent),
                CreatedAt = DateTimeOffset.UtcNow,
            };
            db.OutboxMessages.Add(row);
            await db.SaveChangesAsync(cancellationToken);
            outboxId = row.Id;
        }

        try
        {
            await inner.PublishAsync(integrationEvent, cancellationToken);
            await MarkProcessedAsync(outboxId, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Immediate outbox publish failed for {EventType} ({OutboxId}); dispatcher will retry",
                integrationEvent.EventType,
                outboxId);
            await MarkFailedAsync(outboxId, ex.Message, cancellationToken);
        }
    }

    private async Task MarkProcessedAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        var row = await db.OutboxMessages.FindAsync([id], cancellationToken);
        if (row is null)
        {
            return;
        }

        row.ProcessedAt = DateTimeOffset.UtcNow;
        row.LastError = null;
        row.AttemptCount += 1;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task MarkFailedAsync(Guid id, string error, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        var row = await db.OutboxMessages.FindAsync([id], cancellationToken);
        if (row is null)
        {
            return;
        }

        row.AttemptCount += 1;
        row.LastError = error.Length > 1000 ? error[..1000] : error;
        await db.SaveChangesAsync(cancellationToken);
    }
}
