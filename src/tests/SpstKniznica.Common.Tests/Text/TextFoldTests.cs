using FluentAssertions;
using SpstKniznica.Common.Text;

namespace SpstKniznica.Common.Tests.Text;

public class TextFoldTests
{
    [Theory]
    [InlineData("kniznica", "kniznica")]
    [InlineData("knižnica", "kniznica")]
    [InlineData("KNIŽNICA", "kniznica")]
    [InlineData("Café", "cafe")]
    [InlineData("cafe", "cafe")]
    public void Fold_strips_diacritics_and_lowercases(string input, string expected)
    {
        TextFold.Fold(input).Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Fold_handles_null_or_empty(string? input)
    {
        TextFold.Fold(input).Should().BeEmpty();
    }
}