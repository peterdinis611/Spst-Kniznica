using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Integrations;

namespace SpstKniznica.Common.Tests.Integrations;

public class TurnstileVerifierTests
{
    [Fact]
    public async Task VerifyAsync_skips_when_disabled()
    {
        var sut = Create(enabled: false, secret: null, responseJson: """{"success":false}""");
        (await sut.VerifyAsync(null)).Should().BeTrue();
        sut.IsEnforced.Should().BeFalse();
    }

    [Fact]
    public async Task VerifyAsync_rejects_blank_token_when_enforced()
    {
        var sut = Create(enabled: true, secret: "secret", responseJson: """{"success":true}""");
        (await sut.VerifyAsync(" ")).Should().BeFalse();
        sut.IsEnforced.Should().BeTrue();
    }

    [Fact]
    public async Task VerifyAsync_accepts_success_payload()
    {
        var sut = Create(enabled: true, secret: "secret", responseJson: """{"success":true}""");
        (await sut.VerifyAsync("token-ok")).Should().BeTrue();
    }

    [Fact]
    public async Task VerifyAsync_rejects_failure_payload()
    {
        var sut = Create(enabled: true, secret: "secret", responseJson: """{"success":false}""");
        (await sut.VerifyAsync("token-bad")).Should().BeFalse();
    }

    private static TurnstileVerifier Create(bool enabled, string? secret, string responseJson)
    {
        var options = Options.Create(new TurnstileOptions
        {
            Enabled = enabled,
            SecretKey = secret,
        });

        return new TurnstileVerifier(
            new HttpClient(new FixedJsonHandler(responseJson)),
            options,
            NullLogger<TurnstileVerifier>.Instance);
    }

    private sealed class FixedJsonHandler(string json) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }
}
