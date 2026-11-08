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
}
