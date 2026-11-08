using System.Text;
using MessagingService.Options;
using MessagingService.Services;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging.RabbitMq;

public sealed class RabbitMqConsumerHostedService(
    IOptions<RabbitMqOptions> options,
    IServiceScopeFactory scopeFactory,
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

        try
        {
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
                    ?? EventJson.TryGetEventType(args.Body.ToArray())
                    ?? "Unknown";

                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var relations = scope.ServiceProvider.GetRequiredService<ILibraryRelationService>();
                    await relations.ApplyEventAsync(eventType, payload, stoppingToken);

                    logger.LogInformation(
                        "RabbitMQ event applied. EventType={EventType}, RoutingKey={RoutingKey}",
                        eventType,
                        args.RoutingKey);

                    await _channel.BasicAckAsync(args.DeliveryTag, multiple: false, stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to apply RabbitMQ event {EventType}", eventType);
                    await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: false, cancellationToken: stoppingToken);
                }
            };

            await _channel.BasicConsumeAsync(
                queue: rabbit.Queue,
                autoAck: false,
                consumer: consumer,
                cancellationToken: stoppingToken);

            logger.LogInformation("RabbitMQ consumer listening on queue {Queue}", rabbit.Queue);

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RabbitMQ consumer failed to start; continuing without RabbitMQ");
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
