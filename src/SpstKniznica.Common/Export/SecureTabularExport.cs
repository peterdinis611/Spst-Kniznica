using System.Globalization;
using System.Text;
using System.Xml;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace SpstKniznica.Common.Export;

public enum ExportFormat
{
    Csv,
    Xml,
    Xlsx,
    Pdf,
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

    public ExportFormat ResolvedFormat => ParseFormat(Format);

    public void Normalize()
    {
        Take = Math.Clamp(Take <= 0 ? ExportLimits.DefaultTake : Take, 1, ExportLimits.MaxTake);
        Format = FormatToQueryValue(ResolvedFormat);
    }

    public static ExportFormat ParseFormat(string? format)
    {
        if (string.IsNullOrWhiteSpace(format))
        {
            return ExportFormat.Csv;
        }

        return format.Trim().ToLowerInvariant() switch
        {
            "xml" => ExportFormat.Xml,
            "xlsx" or "excel" or "xls" => ExportFormat.Xlsx,
            "pdf" => ExportFormat.Pdf,
            _ => ExportFormat.Csv,
        };
    }

    public static string FormatToQueryValue(ExportFormat format) => format switch
    {
        ExportFormat.Xml => "xml",
        ExportFormat.Xlsx => "xlsx",
        ExportFormat.Pdf => "pdf",
        _ => "csv",
    };
}

/// <summary>
/// Builds CSV/XML/XLSX/PDF downloads safe for spreadsheet formula injection and XML XXE (writer-only).
/// </summary>
public static class SecureTabularExport
{
    private static readonly char[] FormulaPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n'];
    private static readonly object QuestPdfLicenseGate = new();
    private static bool _questPdfLicenseConfigured;

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

    public static byte[] ToXlsx(
        string sheetName,
        IReadOnlyList<string> headers,
        IEnumerable<IReadOnlyList<string?>> rows)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add(SanitizeSheetName(sheetName));

        for (var col = 0; col < headers.Count; col++)
        {
            var cell = worksheet.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
        }

        var rowIndex = 2;
        foreach (var row in rows)
        {
            for (var col = 0; col < headers.Count; col++)
            {
                var raw = col < row.Count ? row[col] : null;
                var cell = worksheet.Cell(rowIndex, col + 1);
                cell.Value = SpreadsheetText(raw);
                cell.Style.NumberFormat.Format = "@";
            }

            rowIndex++;
        }

        if (headers.Count > 0)
        {
            worksheet.Range(1, 1, 1, headers.Count).SetAutoFilter();
            worksheet.Columns().AdjustToContents(1, 48);
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public static byte[] ToPdf(
        string title,
        IReadOnlyList<string> headers,
        IEnumerable<IReadOnlyList<string?>> rows)
    {
        EnsureQuestPdfLicense();

        var materialised = rows as IReadOnlyList<IReadOnlyList<string?>> ?? rows.ToList();
        var safeTitle = string.IsNullOrWhiteSpace(title) ? "Export" : title.Trim();

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(8));

                page.Header().Column(col =>
                {
                    col.Item().Text(safeTitle).SemiBold().FontSize(14);
                    col.Item().Text($"Vygenerované {DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm} UTC · {materialised.Count} riadkov")
                        .FontSize(8)
                        .FontColor(Colors.Grey.Darken1);
                    col.Item().PaddingTop(6).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
                });

                page.Content().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        if (headers.Count == 0)
                        {
                            columns.RelativeColumn();
                            return;
                        }

                        foreach (var _ in headers)
                        {
                            columns.RelativeColumn();
                        }
                    });

                    table.Header(header =>
                    {
                        foreach (var heading in headers)
                        {
                            header.Cell().Element(HeaderCell).Text(heading).SemiBold();
                        }
                    });

                    foreach (var row in materialised)
                    {
                        for (var i = 0; i < headers.Count; i++)
                        {
                            var value = i < row.Count ? row[i] ?? string.Empty : string.Empty;
                            table.Cell().Element(BodyCell).Text(value);
                        }
                    }
                });

                page.Footer().AlignRight().Text(text =>
                {
                    text.Span("Strana ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();

        static IContainer HeaderCell(IContainer container) => container
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Medium)
            .Background(Colors.Grey.Lighten3)
            .PaddingVertical(4)
            .PaddingHorizontal(3);

        static IContainer BodyCell(IContainer container) => container
            .BorderBottom(0.5f)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(3)
            .PaddingHorizontal(3);
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

    public static string SpreadsheetText(string? value)
    {
        var raw = value ?? string.Empty;
        if (raw.Length > 0 && FormulaPrefixes.Contains(raw[0]))
        {
            return "'" + raw;
        }

        return raw;
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

    private static void EnsureQuestPdfLicense()
    {
        if (_questPdfLicenseConfigured)
        {
            return;
        }

        lock (QuestPdfLicenseGate)
        {
            if (_questPdfLicenseConfigured)
            {
                return;
            }

            QuestPDF.Settings.License = LicenseType.Community;
            _questPdfLicenseConfigured = true;
        }
    }

    private static string SanitizeSheetName(string name)
    {
        var cleaned = SanitizeFileName(name);
        if (cleaned.Length > 31)
        {
            cleaned = cleaned[..31];
        }

        return string.IsNullOrWhiteSpace(cleaned) ? "Export" : cleaned;
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
