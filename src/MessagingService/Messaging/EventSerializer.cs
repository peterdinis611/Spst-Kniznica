using System.Text.Json;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging;

public static class EventSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public static string Serialize<TEvent>(TEvent integrationEvent) where TEvent : IntegrationEvent
        => JsonSerializer.Serialize(integrationEvent, integrationEvent.GetType(), JsonOptions);

    public static byte[] SerializeBytes<TEvent>(TEvent integrationEvent) where TEvent : IntegrationEvent
        => JsonSerializer.SerializeToUtf8Bytes(integrationEvent, integrationEvent.GetType(), JsonOptions);

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
}
