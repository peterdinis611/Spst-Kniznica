using System.Net;
using System.Text.RegularExpressions;

namespace SpstKniznica.Common.Text;

/// <summary>
/// Input guards against stored XSS (JSON-LD / HTML email / URL sinks).
/// React text nodes already escape markup; these rules keep untrusted data out of script/URL contexts.
/// </summary>
public static partial class HtmlSafety
{
    /// <summary>
    /// True when the value has no angle brackets or exotic control characters.
    /// Library fields are plain text — HTML/markup does not belong in titles, bios, notes, etc.
    /// </summary>
    public static bool IsPlainText(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return true;
        }

        foreach (var c in value)
        {
            if (c is '<' or '>' or '\0')
            {
                return false;
            }

            // Allow tab / LF / CR; reject other C0 controls.
            if (c < 0x20 && c is not ('\t' or '\n' or '\r'))
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Absolute http(s) URLs only — blocks javascript:, data:, and relative injection into img/href sinks.
    /// Null/blank is allowed (optional fields).
    /// </summary>
    public static bool IsSafeHttpUrl(string? value, bool allowHttp = true)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return allowHttp &&
               uri.Scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Rejects obvious active content in optional HTML email bodies.
    /// Not a full HTML sanitizer — only a deny-list for scriptable constructs.
    /// </summary>
    public static bool IsSafeHtmlFragment(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return true;
        }

        return !DangerousHtmlRegex().IsMatch(html);
    }

    public static string Encode(string? value)
        => WebUtility.HtmlEncode(value ?? string.Empty);

    [GeneratedRegex(
        @"<script\b|</script\b|javascript:|<iframe\b|<object\b|<embed\b|<svg\b|<math\b|\bon\w+\s*=",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex DangerousHtmlRegex();
}
