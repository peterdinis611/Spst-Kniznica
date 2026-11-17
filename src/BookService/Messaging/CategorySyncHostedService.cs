using System.Text;
using BookService.Services;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Messaging;

namespace BookService.Messaging;

public sealed class CategorySyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<KafkaPublisherOptions> options,
    ILogger<CategorySyncHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var kafka = options.Value;
        if (!kafka.Enabled)
        {
            logger.LogInformation(
                "Kafka is disabled — category/author denormalization relies on HTTP fallback from Category/Author services.");
            return Task.CompletedTask;
        }

        return Task.Run(() => ConsumeLoop(kafka, stoppingToken), stoppingToken);
    }

    private void ConsumeLoop(KafkaPublisherOptions kafka, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var consumer = new ConsumerBuilder<string, string>(new ConsumerConfig
                {
                    BootstrapServers = kafka.BootstrapServers,
                    GroupId = "book-service-catalog-sync",
                    ClientId = $"{kafka.ClientId}-catalog-sync",
                    AutoOffsetReset = AutoOffsetReset.Earliest,
                    EnableAutoCommit = false,
                    SocketTimeoutMs = 10000
                }).Build();

                consumer.Subscribe(kafka.Topic);
                logger.LogInformation("BookService catalog sync subscribed to {Topic}", kafka.Topic);

                while (!stoppingToken.IsCancellationRequested)
                {
                    ConsumeResult<string, string>? result = null;
                    try
                    {
                        result = consumer.Consume(stoppingToken);
                        if (result?.Message?.Value is null)
                        {
                            if (result is not null)
                            {
                                consumer.Commit(result);
                            }

                            continue;
                        }

                        if (!KafkaEventSecurity.IsAuthentic(
                                kafka.SigningSecret,
                                result.Message.Value,
                                result.Message.Headers))
                        {
                            logger.LogWarning(
                                "Rejected Kafka catalog event at offset {Offset}: invalid or missing HMAC",
                                result.Offset.Value);
                            consumer.Commit(result);
                            continue;
                        }

                        var eventType = result.Message.Headers?
                            .FirstOrDefault(h => h.Key == "event-type") is { } header
                            ? Encoding.UTF8.GetString(header.GetValueBytes())
                            : EventJson.TryGetEventType(Encoding.UTF8.GetBytes(result.Message.Value))
                              ?? "Unknown";

                        if (eventType is not (
                            nameof(CategoryUpdatedEvent) or nameof(CategoryDeletedEvent)
                            or nameof(AuthorUpdatedEvent) or nameof(AuthorDeletedEvent)))
                        {
                            consumer.Commit(result);
                            continue;
                        }

                        using var scope = scopeFactory.CreateScope();
                        var denorm = scope.ServiceProvider.GetRequiredService<CatalogDenormalizationService>();
                        denorm.ApplyEventPayloadAsync(eventType, result.Message.Value, stoppingToken)
                            .GetAwaiter()
                            .GetResult();

                        consumer.Commit(result);
                    }
                    catch (ConsumeException ex)
                    {
                        logger.LogError(ex, "Category sync consume error: {Reason}", ex.Error.Reason);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        logger.LogError(
                            ex,
                            "Category sync failed to apply event at offset {Offset} — offset not committed",
                            result?.Offset.Value);
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
                logger.LogError(ex, "Category sync disconnected; retrying in 5s");
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
    }
}
