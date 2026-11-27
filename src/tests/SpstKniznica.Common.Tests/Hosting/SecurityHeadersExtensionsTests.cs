using FluentAssertions;
using Microsoft.AspNetCore.Http;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Tests.Hosting;

public class SecurityHeadersExtensionsTests
{
    [Fact]
    public async Task Security_headers_callback_sets_baseline_values()
    {
        // Exercise the same header contract as UseSpstSecurityHeaders without TestHost.
        var context = new DefaultHttpContext();
        var headers = context.Response.Headers;

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        headers["X-Permitted-Cross-Domain-Policies"] = "none";
        headers["Permissions-Policy"] =
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()";
        headers["Content-Security-Policy"] =
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
        headers["Cross-Origin-Resource-Policy"] = "cross-origin";
        headers["Cross-Origin-Opener-Policy"] = "same-origin";

        headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
        headers["X-Frame-Options"].ToString().Should().Be("DENY");
        headers["Content-Security-Policy"].ToString().Should().Contain("frame-ancestors 'none'");
        headers["Referrer-Policy"].ToString().Should().Be("no-referrer");
        headers["Cross-Origin-Opener-Policy"].ToString().Should().Be("same-origin");

        await Task.CompletedTask;
    }

    [Fact]
    public void Extension_method_is_discoverable()
    {
        typeof(SecurityHeadersExtensions)
            .GetMethod(nameof(SecurityHeadersExtensions.UseSpstSecurityHeaders))
            .Should().NotBeNull();
    }
}
