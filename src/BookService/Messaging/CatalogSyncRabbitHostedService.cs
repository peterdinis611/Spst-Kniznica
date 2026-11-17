using System.Text;
using BookService.Services;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SpstKniznica.Common.Messaging;

namespace BookService.Messaging;

/// <summary>
/// RabbitMQ mirror of <see cref="CategorySyncHostedService"/> for category/author denorm.
/// </summary>
public sealed class CatalogSyncRabbitHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqPublisherOptions> options,
    ILogger<CatalogSyncRabbitHostedService> logger) : BackgroundService
{
    private const string QueueName = "spst.library.book-catalog-sync";

    private IConnection? _connection;
    private IChannel? _channel;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbit = options.Value;
        if (!rabbit.Enabled)
        {
            logger.LogInformation("RabbitMQ catalog sync is disabled");
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
                ClientProvidedName = "book-service-catalog-sync"
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
                        nameof(CategoryUpdatedEvent) or nameof(CategoryDeletedEvent)
                        or nameof(AuthorUpdatedEvent) or nameof(AuthorDeletedEvent))
                    {
                        using var scope = scopeFactory.CreateScope();
                        var denorm = scope.ServiceProvider.GetRequiredService<CatalogDenormalizationService>();
                        await denorm.ApplyEventPayloadAsync(eventType, payload, stoppingToken);
                    }

                    await _channel.BasicAckAsync(args.DeliveryTag, multiple: false, stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "RabbitMQ catalog sync failed for {EventType}", eventType);
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

            logger.LogInformation("BookService RabbitMQ catalog sync listening on {Queue}", QueueName);
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RabbitMQ catalog sync failed to start");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        await base.StopAsync(cancellationToken);
    }
}
