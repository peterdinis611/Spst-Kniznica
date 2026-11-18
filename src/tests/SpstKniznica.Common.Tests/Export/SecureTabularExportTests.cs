using FluentAssertions;
using SpstKniznica.Common.Export;
using System.Text;
using System.Xml.Linq;

namespace SpstKniznica.Common.Tests.Export;

public class SecureTabularExportTests
{
    [Theory]
    [InlineData("=CMD()", "'=CMD()")]
    [InlineData("+1+1", "'+1+1")]
    [InlineData("-1+1", "'-1+1")]
    [InlineData("@SUM(A1)", "'@SUM(A1)")]
    public void CsvCell_prefixes_formula_injection(string input, string expectedInner)
    {
        SecureTabularExport.CsvCell(input).Should().Be($"\"{expectedInner}\"");
    }

    [Fact]
    public void ToCsv_escapes_quotes_and_includes_bom()
    {
        var bytes = SecureTabularExport.ToCsv(
            ["name"],
            [["say \"hi\""]]);

        var text = Encoding.UTF8.GetString(bytes);
        text.Should().StartWith("\uFEFF");
        text.Should().Contain("\"say \"\"hi\"\"\"");
    }

    [Fact]
    public void ToXml_escapes_markup_without_dtd()
    {
        var bytes = SecureTabularExport.ToXml(
            "books",
            "book",
            ["title"],
            [["<script>alert(1)</script>"]]);

        var xml = Encoding.UTF8.GetString(bytes);
        xml.Should().NotContain("<!DOCTYPE");
        xml.Should().NotContain("<script>");
        var doc = XDocument.Parse(xml);
        doc.Root!.Elements("book").Single().Element("title")!.Value
            .Should().Be("<script>alert(1)</script>");
    }

    [Fact]
    public void ExportQuery_clamps_take()
    {
        var q = new ExportQuery { Format = "XML", Take = 99_000 };
        q.Normalize();
        q.Format.Should().Be("xml");
        q.Take.Should().Be(ExportLimits.MaxTake);
        q.ResolvedFormat.Should().Be(ExportFormat.Xml);
    }

    [Theory]
    [InlineData("xlsx", ExportFormat.Xlsx, "xlsx")]
    [InlineData("excel", ExportFormat.Xlsx, "xlsx")]
    [InlineData("pdf", ExportFormat.Pdf, "pdf")]
    [InlineData("CSV", ExportFormat.Csv, "csv")]
    public void ExportQuery_resolves_formats(string input, ExportFormat expected, string normalised)
    {
        var q = new ExportQuery { Format = input, Take = 10 };
        q.Normalize();
        q.ResolvedFormat.Should().Be(expected);
        q.Format.Should().Be(normalised);
    }

    [Fact]
    public void SpreadsheetText_prefixes_formula_injection()
    {
        SecureTabularExport.SpreadsheetText("=CMD()").Should().Be("'=CMD()");
        SecureTabularExport.SpreadsheetText("ok").Should().Be("ok");
    }

    [Fact]
    public void ToXlsx_produces_openxml_package()
    {
        var bytes = SecureTabularExport.ToXlsx(
            "books",
            ["title"],
            [["=1+1"], ["Kniha"]]);

        bytes.Length.Should().BeGreaterThan(64);
        // ZIP/OpenXML local file header
        bytes[0].Should().Be(0x50);
        bytes[1].Should().Be(0x4B);
    }

    [Fact]
    public void ToPdf_produces_pdf_bytes()
    {
        var bytes = SecureTabularExport.ToPdf(
            "books",
            ["title", "author"],
            [["Kniha", "Autor"], ["=CMD()", "X"]]);

        var head = System.Text.Encoding.ASCII.GetString(bytes.AsSpan(0, 5));
        head.Should().Be("%PDF-");
    }

    [Theory]
    [InlineData("", "export")]
    [InlineData("  ", "export")]
    [InlineData("books export!.csv", "books-export--csv")]
    [InlineData("../etc/passwd", "etc-passwd")]
    public void SanitizeFileName_strips_unsafe_characters(string input, string expected)
    {
        SecureTabularExport.SanitizeFileName(input).Should().Be(expected);
    }

    [Fact]
    public void Cell_formats_null_bool_guid_and_datetime_offset()
    {
        SecureTabularExport.Cell(null).Should().BeEmpty();
        SecureTabularExport.Cell(true).Should().Be("true");
        SecureTabularExport.Cell(false).Should().Be("false");

        var id = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        SecureTabularExport.Cell(id).Should().Be("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        var dto = DateTimeOffset.Parse("2024-06-01T12:00:00Z");
        SecureTabularExport.Cell(dto).Should().Be("2024-06-01T12:00:00.0000000+00:00");
    }

    [Fact]
    public void Cell_stringifies_plain_text_without_formula_prefix()
    {
        // Cell is for typed values; formula neutralization happens in CsvCell/SpreadsheetText.
        SecureTabularExport.Cell("=CMD()").Should().Be("=CMD()");
        SecureTabularExport.Cell(42).Should().Be("42");
    }
}
