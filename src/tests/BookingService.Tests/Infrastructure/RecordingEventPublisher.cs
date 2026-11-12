using SpstKniznica.Common.Messaging;

namespace BookingService.Tests.Infrastructure;

public sealed class RecordingEventPublisher : IIntegrationEventPublisher
{
    public List<object> Events { get; } = [];

    public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        Events.Add(integrationEvent!);
        return Task.CompletedTask;
    }
}
