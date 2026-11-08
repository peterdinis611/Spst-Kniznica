using SpstKniznica.Common.Messaging;

namespace MessagingService.Interfaces;

public interface IEventPublisher
{
    string TransportName { get; }
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent;
}
