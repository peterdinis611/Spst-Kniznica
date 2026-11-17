using System.Text;
using FluentAssertions;
using SpstKniznica.Common.Messaging;

namespace SpstKniznica.Common.Tests.Messaging;

public class EventHmacTests
{
    [Fact]
    public void TryVerify_skips_when_secret_empty()
    {
        EventHmac.TryVerify(null, "payload"u8, signature: null).Should().BeTrue();
        EventHmac.TryVerify(" ", "payload"u8, signature: null).Should().BeTrue();
    }

    [Fact]
    public void TryVerify_accepts_matching_signature()
    {
        var body = Encoding.UTF8.GetBytes("""{"eventType":"PingEvent"}""");
        var signature = EventHmac.Sign("test-secret", body);
        EventHmac.TryVerify("test-secret", body, signature).Should().BeTrue();
    }

    [Fact]
    public void TryVerify_rejects_tampered_payload()
    {
        var body = Encoding.UTF8.GetBytes("original");
        var signature = EventHmac.Sign("test-secret", body);
        EventHmac.TryVerify("test-secret", "tampered"u8, signature).Should().BeFalse();
        EventHmac.TryVerify("test-secret", body, signature: null).Should().BeFalse();
    }
}
