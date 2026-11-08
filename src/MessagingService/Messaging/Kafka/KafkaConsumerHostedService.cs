using System.Text;
using Confluent.Kafka;
using MessagingService.Options;
using MessagingService.Services;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging.Kafka;

public sealed class KafkaConsumerHostedService(
    IOptions<KafkaOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<KafkaConsumerHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var kafka = options.Value;
        if (!kafka.Enabled)
        {
            logger.LogInformation("Kafka consumer is disabled");
            return Task.CompletedTask;
        }

        return Task.Run(() => ConsumeLoop(kafka, stoppingToken), stoppingToken);
    }

    private void ConsumeLoop(KafkaOptions kafka, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var consumer = new ConsumerBuilder<string, string>(new ConsumerConfig
                {
                    BootstrapServers = kafka.BootstrapServers,
                    GroupId = kafka.GroupId,
                    ClientId = $"{kafka.ClientId}-consumer",
                    AutoOffsetReset = AutoOffsetReset.Earliest,
                    EnableAutoCommit = true,
                    SocketTimeoutMs = 10000
                }).Build();

                consumer.Subscribe(kafka.Topic);
                logger.LogInformation("Kafka consumer subscribed to topic {Topic}", kafka.Topic);

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var result = consumer.Consume(stoppingToken);
                        if (result?.Message?.Value is null)
                        {
                            continue;
                        }

                        var eventType = result.Message.Headers?
                            .FirstOrDefault(h => h.Key == "event-type") is { } header
                            ? Encoding.UTF8.GetString(header.GetValueBytes())
                            : EventJson.TryGetEventType(Encoding.UTF8.GetBytes(result.Message.Value))
                              ?? "Unknown";

                        using var scope = scopeFactory.CreateScope();
                        var relations = scope.ServiceProvider.GetRequiredService<ILibraryRelationService>();
                        relations.ApplyEventAsync(eventType, result.Message.Value, stoppingToken)
                            .GetAwaiter()
                            .GetResult();

                        logger.LogInformation(
                            "Kafka event applied. EventType={EventType}, Key={Key}, Offset={Offset}",
                            eventType,
                            result.Message.Key,
                            result.Offset.Value);
                    }
                    catch (ConsumeException ex)
                    {
                        logger.LogError(ex, "Kafka consume error: {Reason}", ex.Error.Reason);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        logger.LogError(ex, "Failed to apply Kafka event");
                    }
                }

                consumer.Close();
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Kafka consumer disconnected; retrying in 5s");
                try
                {
                    Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).GetAwaiter().GetResult();
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        logger.LogInformation("Kafka consumer stopped");
    }
}
