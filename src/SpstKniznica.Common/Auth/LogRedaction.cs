using System.Security.Cryptography;
using System.Text;

namespace SpstKniznica.Common.Auth;

public static class LogRedaction
{
    /// <summary>
    /// Short, non-reversible token for logs (avoids raw email / PII).
    /// </summary>
    public static string HashForLog(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "-";
        }

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.Trim().ToLowerInvariant()));
        return Convert.ToHexString(bytes.AsSpan(0, 4)).ToLowerInvariant();
    }
}
