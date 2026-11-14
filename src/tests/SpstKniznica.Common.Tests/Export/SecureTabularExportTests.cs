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
}
