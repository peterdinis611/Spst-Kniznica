using System.Text;
using Confluent.Kafka;
using MessagingService.Interfaces;
using MessagingService.Options;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging.Kafka;

public sealed class KafkaEventPublisher : IEventPublisher, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly KafkaOptions _options;
    private readonly ILogger<KafkaEventPublisher> _logger;

    public string TransportName => "Kafka";

    public KafkaEventPublisher(IOptions<KafkaOptions> options, ILogger<KafkaEventPublisher> logger)
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
        var payload = EventSerializer.Serialize(integrationEvent);
        var message = new Message<string, string>
        {
            Key = integrationEvent.EventId.ToString(),
            Value = payload,
            Headers =
            [
                new Header("event-type", Encoding.UTF8.GetBytes(integrationEvent.EventType)),
                new Header("occurred-at", Encoding.UTF8.GetBytes(integrationEvent.OccurredAt.ToString("O")))
            ]
        };

        var result = await _producer.ProduceAsync(_options.Topic, message, cancellationToken);
        _logger.LogInformation(
            "Published {EventType} to Kafka topic {Topic} (partition {Partition}, offset {Offset})",
            integrationEvent.EventType,
            result.Topic,
            result.Partition.Value,
            result.Offset.Value);
    }

    public void Dispose() => _producer.Dispose();
}
