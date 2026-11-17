using System.Security.Cryptography;
using System.Text;

namespace SpstKniznica.Common.Messaging;

/// <summary>
/// Optional HMAC-SHA256 integrity for broker payloads (header <c>x-spst-signature</c>).
/// When <paramref name="secret"/> is empty, verification is skipped (local/dev).
/// </summary>
public static class EventHmac
{
    public const string HeaderName = "x-spst-signature";

    public static string Sign(string secret, ReadOnlySpan<byte> body)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secret);
        var key = Encoding.UTF8.GetBytes(secret);
        Span<byte> hash = stackalloc byte[32];
        HMACSHA256.HashData(key, body, hash);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static bool TryVerify(string? secret, ReadOnlySpan<byte> body, string? signature)
    {
        if (string.IsNullOrWhiteSpace(secret))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        string expected;
        try
        {
            expected = Sign(secret, body);
        }
        catch
        {
            return false;
        }

        var a = Encoding.UTF8.GetBytes(expected);
        var b = Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant());
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }
}
