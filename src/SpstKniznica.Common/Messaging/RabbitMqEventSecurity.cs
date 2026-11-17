using System.Text;

namespace SpstKniznica.Common.Messaging;

public static class RabbitMqEventSecurity
{
    public static string? ReadSignatureHeader(IDictionary<string, object?>? headers)
    {
        if (headers is null || !headers.TryGetValue(EventHmac.HeaderName, out var raw) || raw is null)
        {
            return null;
        }

        return raw switch
        {
            byte[] bytes => Encoding.UTF8.GetString(bytes),
            ReadOnlyMemory<byte> memory => Encoding.UTF8.GetString(memory.Span),
            string s => s,
            _ => raw.ToString(),
        };
    }

    public static bool IsAuthentic(
        string? signingSecret,
        ReadOnlySpan<byte> body,
        IDictionary<string, object?>? headers)
    {
        if (string.IsNullOrWhiteSpace(signingSecret))
        {
            return true;
        }

        var signature = ReadSignatureHeader(headers);
        return EventHmac.TryVerify(signingSecret, body, signature);
    }

    public static bool IsAuthentic(
        RabbitMqPublisherOptions options,
        ReadOnlySpan<byte> body,
        IDictionary<string, object?>? headers)
        => IsAuthentic(options.SigningSecret, body, headers);
}
