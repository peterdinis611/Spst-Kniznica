using System.Text.Json;

namespace SpstKniznica.Common.Messaging;

public static class EventJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize<TEvent>(TEvent integrationEvent) where TEvent : IntegrationEvent
        => JsonSerializer.Serialize(integrationEvent, integrationEvent.GetType(), Options);

    public static byte[] SerializeBytes<TEvent>(TEvent integrationEvent) where TEvent : IntegrationEvent
        => JsonSerializer.SerializeToUtf8Bytes(integrationEvent, integrationEvent.GetType(), Options);

    public static string? TryGetEventType(ReadOnlySpan<byte> payload)
    {
        try
        {
            using var document = JsonDocument.Parse(payload.ToArray());
            return document.RootElement.TryGetProperty("eventType", out var type)
                ? type.GetString()
                : null;
        }
        catch
        {
            return null;
        }
    }

    public static TEvent? Deserialize<TEvent>(string payload) where TEvent : IntegrationEvent
        => JsonSerializer.Deserialize<TEvent>(payload, Options);

    public static IntegrationEvent? DeserializeByTypeName(string eventType, string payload) =>
        eventType switch
        {
            nameof(BookingCreatedEvent) => Deserialize<BookingCreatedEvent>(payload),
            nameof(BookingUpdatedEvent) => Deserialize<BookingUpdatedEvent>(payload),
            nameof(BookingDeletedEvent) => Deserialize<BookingDeletedEvent>(payload),
            nameof(LoanDueReminderEvent) => Deserialize<LoanDueReminderEvent>(payload),
            nameof(WaitlistPickupReadyEvent) => Deserialize<WaitlistPickupReadyEvent>(payload),
            nameof(CategoryUpdatedEvent) => Deserialize<CategoryUpdatedEvent>(payload),
            nameof(CategoryDeletedEvent) => Deserialize<CategoryDeletedEvent>(payload),
            nameof(AuthorUpdatedEvent) => Deserialize<AuthorUpdatedEvent>(payload),
            nameof(AuthorDeletedEvent) => Deserialize<AuthorDeletedEvent>(payload),
            nameof(BookCreatedEvent) => Deserialize<BookCreatedEvent>(payload),
            nameof(BookUpdatedEvent) => Deserialize<BookUpdatedEvent>(payload),
            nameof(BookDeletedEvent) => Deserialize<BookDeletedEvent>(payload),
            _ => null,
        };
}
