namespace SpstKniznica.Common.Messaging;

public sealed class NullIntegrationEventPublisher : IIntegrationEventPublisher
{
    public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
        => Task.CompletedTask;
}
