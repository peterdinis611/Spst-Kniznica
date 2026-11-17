using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Messaging;

/// <summary>
/// Fan-out to every configured transport (Kafka, RabbitMQ, …). Failures are logged per transport.
/// </summary>
public sealed class CompositeIntegrationEventPublisher(
    IReadOnlyList<IIntegrationEventPublisher> publishers,
    ILogger<CompositeIntegrationEventPublisher> logger) : IIntegrationEventPublisher
{
    public async Task PublishAsync<TEvent>(
        TEvent integrationEvent,
        CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        if (publishers.Count == 0)
        {
            return;
        }

        if (publishers.Count == 1)
        {
            await publishers[0].PublishAsync(integrationEvent, cancellationToken);
            return;
        }

        var tasks = publishers.Select(async publisher =>
        {
            try
            {
                await publisher.PublishAsync(integrationEvent, cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(
                    ex,
                    "Transport {Transport} failed for {EventType}",
                    publisher.GetType().Name,
                    integrationEvent.EventType);
            }
        });

        await Task.WhenAll(tasks);
    }
}
