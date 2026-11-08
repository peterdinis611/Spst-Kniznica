using SpstKniznica.Common.Messaging;

namespace MessagingService.Messaging;

public static class EventSerializer
{
    public static string Serialize<TEvent>(TEvent integrationEvent) where TEvent : IntegrationEvent
        => EventJson.Serialize(integrationEvent);

    public static byte[] SerializeBytes<TEvent>(TEvent integrationEvent) where TEvent : IntegrationEvent
        => EventJson.SerializeBytes(integrationEvent);

    public static string? TryGetEventType(ReadOnlySpan<byte> payload)
        => EventJson.TryGetEventType(payload);
}
