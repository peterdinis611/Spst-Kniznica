using MessagingService.Interfaces;
using MessagingService.Options;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging.RabbitMq;

public sealed class RabbitMqEventPublisher : IEventPublisher, IAsyncDisposable
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqEventPublisher> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IConnection? _connection;
    private IChannel? _channel;

    public string TransportName => "RabbitMQ";

    public RabbitMqEventPublisher(IOptions<RabbitMqOptions> options, ILogger<RabbitMqEventPublisher> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        await EnsureConnectedAsync(cancellationToken);

        var payload = EventSerializer.SerializeBytes(integrationEvent);
        var routingKey = $"library.{integrationEvent.EventType.ToLowerInvariant()}";

        var properties = new BasicProperties
        {
            ContentType = "application/json",
            DeliveryMode = DeliveryModes.Persistent,
            MessageId = integrationEvent.EventId.ToString(),
            Type = integrationEvent.EventType,
            Headers = new Dictionary<string, object?>
            {
                ["event-type"] = integrationEvent.EventType,
                ["occurred-at"] = integrationEvent.OccurredAt.ToString("O")
            }
        };

        await _channel!.BasicPublishAsync(
            exchange: _options.Exchange,
            routingKey: routingKey,
            mandatory: false,
            basicProperties: properties,
            body: payload,
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "Published {EventType} to RabbitMQ exchange {Exchange} with routing key {RoutingKey}",
            integrationEvent.EventType,
            _options.Exchange,
            routingKey);
    }

    private async Task EnsureConnectedAsync(CancellationToken cancellationToken)
    {
        if (_channel is { IsOpen: true })
        {
            return;
        }

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_channel is { IsOpen: true })
            {
                return;
            }

            var factory = CreateFactory();
            _connection = await factory.CreateConnectionAsync(cancellationToken);
            _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);

            await _channel.ExchangeDeclareAsync(
                exchange: _options.Exchange,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false,
                cancellationToken: cancellationToken);

            await _channel.QueueDeclareAsync(
                queue: _options.Queue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                cancellationToken: cancellationToken);

            await _channel.QueueBindAsync(
                queue: _options.Queue,
                exchange: _options.Exchange,
                routingKey: _options.RoutingKey,
                cancellationToken: cancellationToken);

            _logger.LogInformation(
                "RabbitMQ publisher connected to {Host}:{Port}, exchange={Exchange}, queue={Queue}",
                _options.HostName,
                _options.Port,
                _options.Exchange,
                _options.Queue);
        }
        finally
        {
            _gate.Release();
        }
    }

    private ConnectionFactory CreateFactory() => new()
    {
        HostName = _options.HostName,
        Port = _options.Port,
        UserName = _options.UserName,
        Password = _options.Password,
        VirtualHost = _options.VirtualHost,
        ClientProvidedName = "messaging-service-publisher"
    };

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            await _channel.DisposeAsync();
        }

        if (_connection is not null)
        {
            await _connection.DisposeAsync();
        }

        _gate.Dispose();
    }
}
