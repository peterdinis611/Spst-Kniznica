using System.Text;
using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Messaging;

public sealed class KafkaIntegrationEventPublisher : IIntegrationEventPublisher, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly KafkaPublisherOptions _options;
    private readonly ILogger<KafkaIntegrationEventPublisher> _logger;

    public KafkaIntegrationEventPublisher(
        IOptions<KafkaPublisherOptions> options,
        ILogger<KafkaIntegrationEventPublisher> logger)
    {
        _options = options.Value;
        _logger = logger;
        _producer = new ProducerBuilder<string, string>(new ProducerConfig
        {
            BootstrapServers = _options.BootstrapServers,
            ClientId = _options.ClientId,
            Acks = Acks.All,
            EnableIdempotence = true
        }).Build();
    }

    public async Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        if (!_options.Enabled)
        {
            return;
        }

        var payload = EventJson.Serialize(integrationEvent);
        var message = new Message<string, string>
        {
            Key = ResolveKey(integrationEvent),
            Value = payload,
            Headers =
            [
                new Header("event-type", Encoding.UTF8.GetBytes(integrationEvent.EventType)),
                new Header("occurred-at", Encoding.UTF8.GetBytes(integrationEvent.OccurredAt.ToString("O")))
            ]
        };

        try
        {
            var result = await _producer.ProduceAsync(_options.Topic, message, cancellationToken);
            _logger.LogInformation(
                "Published {EventType} to Kafka topic {Topic} (partition {Partition}, offset {Offset})",
                integrationEvent.EventType,
                result.Topic,
                result.Partition.Value,
                result.Offset.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Booking/catalog writes must not fail when the broker is briefly unavailable.
            _logger.LogError(
                ex,
                "Failed to publish {EventType} to Kafka topic {Topic}",
                integrationEvent.EventType,
                _options.Topic);
        }
    }

    private static string ResolveKey(IntegrationEvent integrationEvent) => integrationEvent switch
    {
        BookCreatedEvent e => e.BookId.ToString(),
        BookUpdatedEvent e => e.BookId.ToString(),
        BookDeletedEvent e => e.BookId.ToString(),
        CategoryCreatedEvent e => e.CategoryId.ToString(),
        CategoryUpdatedEvent e => e.CategoryId.ToString(),
        CategoryDeletedEvent e => e.CategoryId.ToString(),
        AuthorCreatedEvent e => e.AuthorId.ToString(),
        AuthorUpdatedEvent e => e.AuthorId.ToString(),
        AuthorDeletedEvent e => e.AuthorId.ToString(),
        BookingCreatedEvent e => e.BookingId.ToString(),
        BookingUpdatedEvent e => e.BookingId.ToString(),
        BookingDeletedEvent e => e.BookingId.ToString(),
        _ => integrationEvent.EventId.ToString()
    };

    public void Dispose() => _producer.Dispose();
}
