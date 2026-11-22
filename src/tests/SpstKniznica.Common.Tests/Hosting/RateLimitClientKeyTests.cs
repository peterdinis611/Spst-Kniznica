using System.Net;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Tests.Hosting;

public class RateLimitClientKeyTests
{
    [Fact]
    public void Empty_proxy_list_ignores_forwarded_header()
    {
        var context = Context("10.0.0.8", "1.2.3.4");

        var key = RateLimitClientKey.Resolve(
            context,
            trustForwardedFor: true,
            RateLimitClientKey.ParseProxies([]));

        key.Should().Be("ip:10.0.0.8");
    }

    [Fact]
    public void Known_proxy_uses_the_last_forwarded_hop()
    {
        var context = Context("127.0.0.1", "9.9.9.9, 203.0.113.8");

        var key = RateLimitClientKey.Resolve(
            context,
            trustForwardedFor: true,
            RateLimitClientKey.ParseProxies(["127.0.0.1"]));

        key.Should().Be("ip:203.0.113.8");
    }

    [Fact]
    public void Unlisted_peer_cannot_supply_the_header()
    {
        var context = Context("203.0.113.8", "1.2.3.4");

        var key = RateLimitClientKey.Resolve(
            context,
            trustForwardedFor: true,
            RateLimitClientKey.ParseProxies(["127.0.0.1"]));

        key.Should().Be("ip:203.0.113.8");
    }

    [Fact]
    public void Ipv4_mapped_loopback_counts_as_the_local_gateway()
    {
        var context = Context("::ffff:127.0.0.1", "198.51.100.4");

        var key = RateLimitClientKey.Resolve(
            context,
            trustForwardedFor: true,
            RateLimitClientKey.ParseProxies(["127.0.0.1"]));

        key.Should().Be("ip:198.51.100.4");
    }

    [Fact]
    public void Authenticated_user_is_partitioned_by_oid()
    {
        var context = Context("127.0.0.1", "203.0.113.8");
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("oid", "student-1")],
            authenticationType: "test"));

        var key = RateLimitClientKey.Resolve(
            context,
            trustForwardedFor: true,
            RateLimitClientKey.ParseProxies(["127.0.0.1"]));

        key.Should().Be("u:student-1");
    }

    private static DefaultHttpContext Context(string remote, string forwarded)
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse(remote);
        context.Request.Headers["X-Forwarded-For"] = forwarded;
        return context;
    }
}
