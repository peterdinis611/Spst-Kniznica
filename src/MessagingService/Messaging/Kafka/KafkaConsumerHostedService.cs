using System.Text;
using Confluent.Kafka;
using MessagingService.Options;
using Microsoft.Extensions.Options;

namespace MessagingService.Messaging.Kafka;

public sealed class KafkaConsumerHostedService(
    IOptions<KafkaOptions> options,
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
        using var consumer = new ConsumerBuilder<string, string>(new ConsumerConfig
        {
            BootstrapServers = kafka.BootstrapServers,
            GroupId = kafka.GroupId,
            ClientId = $"{kafka.ClientId}-consumer",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true
        }).Build();

        consumer.Subscribe(kafka.Topic);
        logger.LogInformation("Kafka consumer subscribed to topic {Topic}", kafka.Topic);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);
                    if (result is null)
                    {
                        continue;
                    }

                    var eventType = result.Message.Headers?
                        .FirstOrDefault(h => h.Key == "event-type") is { } header
                        ? Encoding.UTF8.GetString(header.GetValueBytes())
                        : EventSerializer.TryGetEventType(Encoding.UTF8.GetBytes(result.Message.Value ?? string.Empty));

                    logger.LogInformation(
                        "Kafka message received. EventType={EventType}, Key={Key}, Partition={Partition}, Offset={Offset}, Payload={Payload}",
                        eventType,
                        result.Message.Key,
                        result.Partition.Value,
                        result.Offset.Value,
                        result.Message.Value);
                }
                catch (ConsumeException ex)
                {
                    logger.LogError(ex, "Kafka consume error: {Reason}", ex.Error.Reason);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
        finally
        {
            consumer.Close();
            logger.LogInformation("Kafka consumer stopped");
        }
    }
}
