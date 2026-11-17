using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace SpstKniznica.Common.Messaging;

public sealed class RabbitMqIntegrationEventPublisher : IIntegrationEventPublisher, IAsyncDisposable
{
    private readonly RabbitMqPublisherOptions _options;
    private readonly ILogger<RabbitMqIntegrationEventPublisher> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IConnection? _connection;
    private IChannel? _channel;

    public RabbitMqIntegrationEventPublisher(
        IOptions<RabbitMqPublisherOptions> options,
        ILogger<RabbitMqIntegrationEventPublisher> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task PublishAsync<TEvent>(
        TEvent integrationEvent,
        CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        if (!_options.Enabled)
        {
            return;
        }

        try
        {
            await EnsureConnectedAsync(cancellationToken);

            var payload = EventJson.SerializeBytes(integrationEvent);
            var routingKey = $"library.{integrationEvent.EventType.ToLowerInvariant()}";

            var headers = new Dictionary<string, object?>
            {
                ["event-type"] = integrationEvent.EventType,
                ["occurred-at"] = integrationEvent.OccurredAt.ToString("O")
            };

            if (!string.IsNullOrWhiteSpace(_options.SigningSecret))
            {
                headers[EventHmac.HeaderName] = EventHmac.Sign(_options.SigningSecret, payload);
            }

            var properties = new BasicProperties
            {
                ContentType = "application/json",
                DeliveryMode = DeliveryModes.Persistent,
                MessageId = integrationEvent.EventId.ToString(),
                Type = integrationEvent.EventType,
                Headers = headers
            };

            await _channel!.BasicPublishAsync(
                exchange: _options.Exchange,
                routingKey: routingKey,
                mandatory: false,
                basicProperties: properties,
                body: payload,
                cancellationToken: cancellationToken);

            _logger.LogInformation(
                "Published {EventType} to RabbitMQ exchange {Exchange} ({RoutingKey})",
                integrationEvent.EventType,
                _options.Exchange,
                routingKey);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(
                ex,
                "Failed to publish {EventType} to RabbitMQ exchange {Exchange}",
                integrationEvent.EventType,
                _options.Exchange);
        }
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

            var factory = new ConnectionFactory
            {
                HostName = _options.HostName,
                Port = _options.Port,
                UserName = _options.UserName,
                Password = _options.Password,
                VirtualHost = _options.VirtualHost,
                ClientProvidedName = _options.ClientName
            };

            _connection = await factory.CreateConnectionAsync(cancellationToken);
            _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);

            await _channel.ExchangeDeclareAsync(
                exchange: _options.Exchange,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false,
                cancellationToken: cancellationToken);

            if (!string.IsNullOrWhiteSpace(_options.Queue))
            {
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
            }

            _logger.LogInformation(
                "RabbitMQ publisher connected to {Host}:{Port}, exchange={Exchange}",
                _options.HostName,
                _options.Port,
                _options.Exchange);
        }
        finally
        {
            _gate.Release();
        }
    }

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
