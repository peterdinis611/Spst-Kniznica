using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Messaging;

/// <summary>
/// HTTP push of catalog/booking events to BookService when Kafka is off (or as dual-write).
/// </summary>
public sealed class BookServiceEventHttpNotifier(
    HttpClient httpClient,
    IOptions<InternalApiOptions> internalApi,
    ILogger<BookServiceEventHttpNotifier> logger)
{
    public async Task NotifyAsync<TEvent>(
        TEvent integrationEvent,
        CancellationToken cancellationToken = default)
        where TEvent : IntegrationEvent
    {
        if (!ShouldNotify(integrationEvent))
        {
            return;
        }

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "api/internal/catalog/events");

            var key = internalApi.Value.SharedKey?.Trim();
            if (!string.IsNullOrEmpty(key))
            {
                request.Headers.TryAddWithoutValidation(InternalApiOptions.HeaderName, key);
            }

            request.Content = JsonContent.Create(new CatalogSyncEventBody(
                integrationEvent.EventType,
                EventJson.Serialize(integrationEvent)));

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new HttpRequestException(
                    $"BookService HTTP sync returned {(int)response.StatusCode} for {integrationEvent.EventType}: {body}");
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(
                ex,
                "BookService HTTP sync failed for {EventType}",
                integrationEvent.EventType);
            throw;
        }
    }

    private static bool ShouldNotify(IntegrationEvent integrationEvent) =>
        integrationEvent is CategoryUpdatedEvent
            or CategoryDeletedEvent
            or AuthorUpdatedEvent
            or AuthorDeletedEvent
            or BookingCreatedEvent
            or BookingUpdatedEvent
            or BookingDeletedEvent;

    private sealed record CatalogSyncEventBody(string EventType, string Payload);
}
