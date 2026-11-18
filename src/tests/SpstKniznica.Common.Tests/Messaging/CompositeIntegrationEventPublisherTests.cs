using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using SpstKniznica.Common.Messaging;

namespace SpstKniznica.Common.Tests.Messaging;

public class CompositeIntegrationEventPublisherTests
{
    [Fact]
    public async Task PublishAsync_noop_when_no_transports()
    {
        var sut = new CompositeIntegrationEventPublisher(
            [],
            NullLogger<CompositeIntegrationEventPublisher>.Instance);

        var act = async () => await sut.PublishAsync(new PingEvent("test", "hi"));

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PublishAsync_calls_single_transport_directly()
    {
        var transport = new RecordingPublisher();
        var sut = new CompositeIntegrationEventPublisher(
            [transport],
            NullLogger<CompositeIntegrationEventPublisher>.Instance);

        await sut.PublishAsync(new PingEvent("test", "hi"));

        transport.Events.Should().ContainSingle()
            .Which.Should().BeOfType<PingEvent>();
    }

    [Fact]
    public async Task PublishAsync_continues_when_one_transport_fails()
    {
        var ok = new RecordingPublisher();
        var failing = new FailingPublisher();
        var sut = new CompositeIntegrationEventPublisher(
            [failing, ok],
            NullLogger<CompositeIntegrationEventPublisher>.Instance);

        var act = async () => await sut.PublishAsync(new PingEvent("test", "hi"));

        await act.Should().NotThrowAsync();
        ok.Events.Should().ContainSingle();
    }

    private sealed class RecordingPublisher : IIntegrationEventPublisher
    {
        public List<IntegrationEvent> Events { get; } = [];

        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
            where TEvent : IntegrationEvent
        {
            Events.Add(integrationEvent);
            return Task.CompletedTask;
        }
    }

    private sealed class FailingPublisher : IIntegrationEventPublisher
    {
        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
            where TEvent : IntegrationEvent
            => throw new InvalidOperationException("transport down");
    }
}
