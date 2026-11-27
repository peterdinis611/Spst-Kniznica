using FluentAssertions;
using SpstKniznica.Common.Data;

namespace SpstKniznica.Common.Tests.Data;

public class SqliteLegacyStoreTypesTests
{
    [Fact]
    public void DateTimeOffset_roundtrips_iso_text()
    {
        var dto = DateTimeOffset.Parse("2026-11-27T20:15:30.1234567+01:00");
        var stored = SqliteLegacyStoreTypes.DateTimeOffsetRequired.ConvertToProvider(dto) as string;
        stored.Should().NotBeNullOrWhiteSpace();

        var roundtrip = (DateTimeOffset)SqliteLegacyStoreTypes.DateTimeOffsetRequired.ConvertFromProvider(stored)!;
        roundtrip.Should().Be(dto);
    }

    [Fact]
    public void Bool_roundtrips_as_integer()
    {
        SqliteLegacyStoreTypes.BoolAsInteger.ConvertToProvider(true).Should().Be(1);
        SqliteLegacyStoreTypes.BoolAsInteger.ConvertToProvider(false).Should().Be(0);
        SqliteLegacyStoreTypes.BoolAsInteger.ConvertFromProvider(1).Should().Be(true);
        SqliteLegacyStoreTypes.BoolAsInteger.ConvertFromProvider(0).Should().Be(false);
    }
}
