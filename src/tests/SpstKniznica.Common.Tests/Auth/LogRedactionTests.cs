using FluentAssertions;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class LogRedactionTests
{
    [Fact]
    public void HashForLog_is_stable_and_not_raw_email()
    {
        var hash = LogRedaction.HashForLog("anna.novakova@spst.sk");

        hash.Should().HaveLength(8);
        hash.Should().NotContain("@");
        LogRedaction.HashForLog("Anna.Novakova@spst.sk").Should().Be(hash);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void HashForLog_blank_returns_dash(string? value)
    {
        LogRedaction.HashForLog(value).Should().Be("-");
    }
}
