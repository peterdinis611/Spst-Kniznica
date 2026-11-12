using FluentAssertions;
using SpstKniznica.Common.Text;

namespace SpstKniznica.Common.Tests.Text;

public class StringNormalizeTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Optional_returns_null_for_blank_values(string? value)
    {
        StringNormalize.Optional(value).Should().BeNull();
    }

    [Fact]
    public void Optional_trims_non_blank_values()
    {
        StringNormalize.Optional("  hello  ").Should().Be("hello");
    }

    [Fact]
    public void Required_trims_value()
    {
        StringNormalize.Required("  Eva  ").Should().Be("Eva");
    }
}
