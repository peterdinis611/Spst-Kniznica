using System.Text;
using Confluent.Kafka;

namespace SpstKniznica.Common.Messaging;

public static class KafkaEventSecurity
{
    public static string? ReadSignature(Headers? headers)
    {
        var header = headers?.FirstOrDefault(h =>
            string.Equals(h.Key, EventHmac.HeaderName, StringComparison.OrdinalIgnoreCase));
        if (header is null)
        {
            return null;
        }

        return Encoding.UTF8.GetString(header.GetValueBytes());
    }

    public static bool IsAuthentic(string? signingSecret, string payload, Headers? headers)
    {
        if (string.IsNullOrWhiteSpace(signingSecret))
        {
            return true;
        }

        var signature = ReadSignature(headers);
        return EventHmac.TryVerify(signingSecret, Encoding.UTF8.GetBytes(payload), signature);
    }
}
