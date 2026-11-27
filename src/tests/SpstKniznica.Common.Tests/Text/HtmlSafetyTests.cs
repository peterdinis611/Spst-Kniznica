using FluentAssertions;
using SpstKniznica.Common.Text;

namespace SpstKniznica.Common.Tests.Text;

public class HtmlSafetyTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Elektrotechnika I")]
    [InlineData("Line\nbreak\tand tab")]
    public void IsPlainText_accepts_safe_values(string? value)
    {
        HtmlSafety.IsPlainText(value).Should().BeTrue();
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("Title </script><script>")]
    [InlineData("a\0b")]
    [InlineData("bell\u0007")]
    public void IsPlainText_rejects_markup_and_controls(string value)
    {
        HtmlSafety.IsPlainText(value).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg")]
    [InlineData("http://localhost:3000/cover.png")]
    public void IsSafeHttpUrl_accepts_http_https_or_blank(string? value)
    {
        HtmlSafety.IsSafeHttpUrl(value).Should().BeTrue();
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html,<script>")]
    [InlineData("//evil.example/x")]
    [InlineData("/relative.jpg")]
    [InlineData("ftp://files.example/a.jpg")]
    public void IsSafeHttpUrl_rejects_non_http(string value)
    {
        HtmlSafety.IsSafeHttpUrl(value).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("<p>Hello <strong>reader</strong></p>")]
    public void IsSafeHtmlFragment_allows_simple_markup(string? html)
    {
        HtmlSafety.IsSafeHtmlFragment(html).Should().BeTrue();
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("<img src=x onerror=alert(1)>")]
    [InlineData("<a href=\"javascript:alert(1)\">x</a>")]
    [InlineData("<iframe src=https://evil></iframe>")]
    public void IsSafeHtmlFragment_rejects_active_content(string html)
    {
        HtmlSafety.IsSafeHtmlFragment(html).Should().BeFalse();
    }

    [Fact]
    public void Encode_escapes_angle_brackets()
    {
        HtmlSafety.Encode("<b>x</b>").Should().Be("&lt;b&gt;x&lt;/b&gt;");
    }
}
