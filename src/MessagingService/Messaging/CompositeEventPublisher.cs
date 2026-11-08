using MessagingService.Interfaces;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging;

public sealed class CompositeEventPublisher(
    IEnumerable<IEventPublisher> publishers,
    ILogger<CompositeEventPublisher> logger) : IEventPublisher
{
    public string TransportName => "Composite";

    public async Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        var tasks = publishers.Select(async publisher =>
        {
            try
            {
                await publisher.PublishAsync(integrationEvent, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Failed to publish {EventType} via {Transport}",
                    integrationEvent.EventType,
                    publisher.TransportName);
                throw;
            }
        });

        await Task.WhenAll(tasks);
    }
}
