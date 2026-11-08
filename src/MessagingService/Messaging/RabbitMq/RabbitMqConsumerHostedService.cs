using System.Text;
using MessagingService.Options;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace MessagingService.Messaging.RabbitMq;

public sealed class RabbitMqConsumerHostedService(
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    private IConnection? _connection;
    private IChannel? _channel;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbit = options.Value;
        if (!rabbit.Enabled)
        {
            logger.LogInformation("RabbitMQ consumer is disabled");
            return;
        }

        var factory = new ConnectionFactory
        {
            HostName = rabbit.HostName,
            Port = rabbit.Port,
            UserName = rabbit.UserName,
            Password = rabbit.Password,
            VirtualHost = rabbit.VirtualHost,
            ClientProvidedName = "messaging-service-consumer"
        };

        _connection = await factory.CreateConnectionAsync(stoppingToken);
        _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await _channel.ExchangeDeclareAsync(
            exchange: rabbit.Exchange,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false,
            cancellationToken: stoppingToken);

        await _channel.QueueDeclareAsync(
            queue: rabbit.Queue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: stoppingToken);

        await _channel.QueueBindAsync(
            queue: rabbit.Queue,
            exchange: rabbit.Exchange,
            routingKey: rabbit.RoutingKey,
            cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += async (_, args) =>
        {
            var payload = Encoding.UTF8.GetString(args.Body.ToArray());
            var eventType = args.BasicProperties.Type
                ?? EventSerializer.TryGetEventType(args.Body.ToArray())
                ?? "Unknown";

            logger.LogInformation(
                "RabbitMQ message received. EventType={EventType}, RoutingKey={RoutingKey}, DeliveryTag={DeliveryTag}, Payload={Payload}",
                eventType,
                args.RoutingKey,
                args.DeliveryTag,
                payload);

            await _channel.BasicAckAsync(args.DeliveryTag, multiple: false, stoppingToken);
        };

        await _channel.BasicConsumeAsync(
            queue: rabbit.Queue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation("RabbitMQ consumer listening on queue {Queue}", rabbit.Queue);

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null)
        {
            await _channel.DisposeAsync();
        }

        if (_connection is not null)
        {
            await _connection.DisposeAsync();
        }

        await base.StopAsync(cancellationToken);
        logger.LogInformation("RabbitMQ consumer stopped");
    }
}
