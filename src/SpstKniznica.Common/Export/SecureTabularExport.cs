using System.Globalization;
using System.Text;
using System.Xml;

namespace SpstKniznica.Common.Export;

public enum ExportFormat
{
    Csv,
    Xml,
}

public static class ExportLimits
{
    public const int DefaultTake = 2000;
    public const int MaxTake = 5000;
}

public sealed class ExportQuery
{
    public string Format { get; set; } = "csv";
    public int Take { get; set; } = ExportLimits.DefaultTake;

    public ExportFormat ResolvedFormat =>
        string.Equals(Format, "xml", StringComparison.OrdinalIgnoreCase)
            ? ExportFormat.Xml
            : ExportFormat.Csv;

    public void Normalize()
    {
        Take = Math.Clamp(Take <= 0 ? ExportLimits.DefaultTake : Take, 1, ExportLimits.MaxTake);
        Format = ResolvedFormat == ExportFormat.Xml ? "xml" : "csv";
    }
}

/// <summary>
/// Builds CSV/XML downloads safe for spreadsheet formula injection and XML XXE (writer-only).
/// </summary>
public static class SecureTabularExport
{
    private static readonly char[] FormulaPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n'];

    public static byte[] ToCsv(IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<string?>> rows)
    {
        var sb = new StringBuilder();
        // UTF-8 BOM so Excel opens Slovak diacritics correctly.
        sb.Append('\uFEFF');
        sb.AppendLine(string.Join(',', headers.Select(CsvCell)));

        foreach (var row in rows)
        {
            sb.AppendLine(string.Join(',', row.Select(CsvCell)));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public static byte[] ToXml(
        string rootName,
        string rowName,
        IReadOnlyList<string> headers,
        IEnumerable<IReadOnlyList<string?>> rows)
    {
        var settings = new XmlWriterSettings
        {
            Encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            Indent = true,
            OmitXmlDeclaration = false,
            NewLineHandling = NewLineHandling.Replace,
            CheckCharacters = true,
            ConformanceLevel = ConformanceLevel.Document,
        };

        using var stream = new MemoryStream();
        using (var writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement(SanitizeName(rootName));

            foreach (var row in rows)
            {
                writer.WriteStartElement(SanitizeName(rowName));
                for (var i = 0; i < headers.Count; i++)
                {
                    var name = SanitizeName(headers[i]);
                    var value = i < row.Count ? row[i] ?? string.Empty : string.Empty;
                    writer.WriteElementString(name, value);
                }

                writer.WriteEndElement();
            }

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }

        return stream.ToArray();
    }

    public static string CsvCell(string? value)
    {
        var raw = value ?? string.Empty;
        // Mitigate CSV / spreadsheet formula injection (OWASP).
        if (raw.Length > 0 && FormulaPrefixes.Contains(raw[0]))
        {
            raw = "'" + raw;
        }

        return $"\"{raw.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }

    public static string Cell(object? value) => value switch
    {
        null => string.Empty,
        DateTimeOffset dto => dto.ToString("o", CultureInfo.InvariantCulture),
        DateTime dt => dt.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture),
        bool b => b ? "true" : "false",
        IFormattable f => f.ToString(null, CultureInfo.InvariantCulture) ?? string.Empty,
        _ => value.ToString() ?? string.Empty,
    };

    public static string SanitizeFileName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "export";
        var cleaned = new string(name
            .Trim()
            .Select(ch => char.IsAsciiLetterOrDigit(ch) || ch is '-' or '_' ? ch : '-')
            .ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "export" : cleaned.Trim('-');
    }

    private static string SanitizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "field";
        var sb = new StringBuilder(name.Length);
        foreach (var ch in name.Trim())
        {
            if (char.IsAsciiLetterOrDigit(ch) || ch == '_')
            {
                sb.Append(ch);
            }
            else if (ch is '-' or ' ')
            {
                sb.Append('_');
            }
        }

        if (sb.Length == 0) return "field";
        if (char.IsDigit(sb[0])) sb.Insert(0, '_');
        return sb.ToString();
    }
}
