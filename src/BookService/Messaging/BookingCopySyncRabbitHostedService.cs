using System.Text;
using BookService.Services;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SpstKniznica.Common.Messaging;

namespace BookService.Messaging;

/// <summary>
/// RabbitMQ mirror of <see cref="BookingCopySyncHostedService"/> for copy availability.
/// </summary>
public sealed class BookingCopySyncRabbitHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqPublisherOptions> options,
    ILogger<BookingCopySyncRabbitHostedService> logger) : BackgroundService
{
    private const string QueueName = "spst.library.book-copy-sync";

    private IConnection? _connection;
    private IChannel? _channel;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbit = options.Value;
        if (!rabbit.Enabled)
        {
            logger.LogInformation("RabbitMQ booking-copy sync is disabled");
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
                ClientProvidedName = "book-service-copy-sync"
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
                queue: QueueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                cancellationToken: stoppingToken);

            await _channel.QueueBindAsync(
                queue: QueueName,
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
                    if (eventType is
                        nameof(BookingCreatedEvent)
                        or nameof(BookingUpdatedEvent)
                        or nameof(BookingDeletedEvent))
                    {
                        using var scope = scopeFactory.CreateScope();
                        var denorm = scope.ServiceProvider
                            .GetRequiredService<BookingCopyDenormalizationService>();
                        await denorm.ApplyEventPayloadAsync(eventType, payload, stoppingToken);
                    }

                    await _channel.BasicAckAsync(args.DeliveryTag, multiple: false, stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "RabbitMQ booking-copy sync failed for {EventType}", eventType);
                    await _channel.BasicNackAsync(
                        args.DeliveryTag,
                        multiple: false,
                        requeue: false,
                        cancellationToken: stoppingToken);
                }
            };

            await _channel.BasicConsumeAsync(
                queue: QueueName,
                autoAck: false,
                consumer: consumer,
                cancellationToken: stoppingToken);

            logger.LogInformation("BookService RabbitMQ booking-copy sync listening on {Queue}", QueueName);
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RabbitMQ booking-copy sync failed to start");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        await base.StopAsync(cancellationToken);
    }
}
