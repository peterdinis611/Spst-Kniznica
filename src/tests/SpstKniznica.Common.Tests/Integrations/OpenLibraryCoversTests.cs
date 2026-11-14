using FluentAssertions;
using SpstKniznica.Common.Integrations;

namespace SpstKniznica.Common.Tests.Integrations;

public class OpenLibraryCoversTests
{
    [Theory]
    [InlineData("978-0-13-110362-7", "9780131103627")]
    [InlineData("0 306 40615 2", "0306406152")]
    [InlineData("9780131103627", "9780131103627")]
    public void NormalizeIsbn_strips_separators(string input, string expected)
    {
        OpenLibraryCovers.NormalizeIsbn(input).Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("123")]
    [InlineData("abcdefghij")]
    public void NormalizeIsbn_rejects_invalid(string? input)
    {
        OpenLibraryCovers.NormalizeIsbn(input).Should().BeNull();
    }

    [Fact]
    public void ForIsbn_builds_cover_url()
    {
        OpenLibraryCovers.ForIsbn("978-0-13-110362-7")
            .Should().Be("https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg");

        OpenLibraryCovers.ForIsbn("9780131103627", 'M')
            .Should().Be("https://covers.openlibrary.org/b/isbn/9780131103627-M.jpg");
    }

    [Fact]
    public void ForIsbn_returns_null_for_bad_isbn()
    {
        OpenLibraryCovers.ForIsbn("nope").Should().BeNull();
    }
}
