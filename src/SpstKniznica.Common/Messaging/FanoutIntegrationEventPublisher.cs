using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Messaging;

/// <summary>
/// Publishes to the primary bus (Kafka / null) then optionally HTTP-notifies BookService.
/// </summary>
public sealed class FanoutIntegrationEventPublisher(
    IIntegrationEventPublisher primary,
    IServiceScopeFactory scopeFactory,
    ILogger<FanoutIntegrationEventPublisher> logger) : IIntegrationEventPublisher
{
    public async Task PublishAsync<TEvent>(
        TEvent integrationEvent,
        CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        // Booking copy sync: HTTP first so the catalog AvailableCopies updates before the UI refreshes.
        // Brokers still get the event for mail/audit and other consumers.
        var preferHttpFirst = integrationEvent is BookingCreatedEvent
            or BookingUpdatedEvent
            or BookingDeletedEvent;

        if (preferHttpFirst)
        {
            // Fail the publish (outbox retries) when copy denorm cannot be applied.
            await TryHttpNotifyAsync(integrationEvent, throwOnFailure: true, cancellationToken);
            await primary.PublishAsync(integrationEvent, cancellationToken);
            return;
        }

        await primary.PublishAsync(integrationEvent, cancellationToken);
        await TryHttpNotifyAsync(integrationEvent, throwOnFailure: false, cancellationToken);
    }

    private async Task TryHttpNotifyAsync<TEvent>(
        TEvent integrationEvent,
        bool throwOnFailure,
        CancellationToken cancellationToken)
        where TEvent : IntegrationEvent
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var httpNotifier = scope.ServiceProvider.GetService<BookServiceEventHttpNotifier>();
            if (httpNotifier is null)
            {
                return;
            }

            await httpNotifier.NotifyAsync(integrationEvent, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "HTTP fan-out failed for {EventType}",
                integrationEvent.EventType);
            if (throwOnFailure)
            {
                throw;
            }
        }
    }
}
