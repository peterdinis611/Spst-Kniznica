using System.Text;
using BookService.Services;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Messaging;

namespace BookService.Messaging;

/// <summary>
/// Applies booking lifecycle events to book copy status so catalog availability matches reality.
/// </summary>
public sealed class BookingCopySyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<KafkaPublisherOptions> options,
    ILogger<BookingCopySyncHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var kafka = options.Value;
        if (!kafka.Enabled)
        {
            logger.LogInformation(
                "Kafka is disabled — booking copy status relies on HTTP fallback from BookingService.");
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
                    GroupId = "book-service-booking-copy-sync",
                    ClientId = $"{kafka.ClientId}-booking-copy-sync",
                    AutoOffsetReset = AutoOffsetReset.Earliest,
                    EnableAutoCommit = false,
                    SocketTimeoutMs = 10000
                }).Build();

                consumer.Subscribe(kafka.Topic);
                logger.LogInformation("BookService booking-copy sync subscribed to {Topic}", kafka.Topic);

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

                        var eventType = result.Message.Headers?
                            .FirstOrDefault(h => h.Key == "event-type") is { } header
                            ? Encoding.UTF8.GetString(header.GetValueBytes())
                            : EventJson.TryGetEventType(Encoding.UTF8.GetBytes(result.Message.Value))
                              ?? "Unknown";

                        if (eventType is not (
                            nameof(BookingCreatedEvent)
                            or nameof(BookingUpdatedEvent)
                            or nameof(BookingDeletedEvent)))
                        {
                            consumer.Commit(result);
                            continue;
                        }

                        using var scope = scopeFactory.CreateScope();
                        var denorm = scope.ServiceProvider
                            .GetRequiredService<BookingCopyDenormalizationService>();
                        denorm.ApplyEventPayloadAsync(eventType, result.Message.Value, stoppingToken)
                            .GetAwaiter()
                            .GetResult();

                        consumer.Commit(result);
                    }
                    catch (ConsumeException ex)
                    {
                        logger.LogError(ex, "Booking-copy sync consume error: {Reason}", ex.Error.Reason);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        logger.LogError(
                            ex,
                            "Booking-copy sync failed at offset {Offset} — offset not committed",
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
                logger.LogError(ex, "Booking-copy sync disconnected; retrying in 5s");
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
