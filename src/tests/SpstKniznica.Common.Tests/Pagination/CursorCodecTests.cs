using FluentAssertions;
using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Tests.Pagination;

public class CursorCodecTests
{
    [Fact]
    public void Encode_decode_roundtrips_guid()
    {
        var id = Guid.Parse("c3333333-3333-4333-8333-333333333013");

        var encoded = CursorCodec.Encode(id);
        CursorCodec.TryDecode(encoded, out var decoded).Should().BeTrue();
        decoded.Should().Be(id);
    }

    [Fact]
    public void TryDecode_accepts_plain_guid_string()
    {
        var id = Guid.Parse("b2222222-2222-4222-8222-222222222006");

        CursorCodec.TryDecode(id.ToString(), out var decoded).Should().BeTrue();
        decoded.Should().Be(id);
    }

    [Fact]
    public void TryDecode_rejects_garbage()
    {
        CursorCodec.TryDecode("not-a-cursor", out _).Should().BeFalse();
        CursorCodec.TryDecode(" ", out _).Should().BeFalse();
        CursorCodec.TryDecode(null, out _).Should().BeFalse();
    }
}
