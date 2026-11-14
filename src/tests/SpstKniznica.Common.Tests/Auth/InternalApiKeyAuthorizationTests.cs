using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class InternalApiKeyAuthorizationTests
{
    [Fact]
    public async Task Succeeds_when_header_matches_shared_key()
    {
        var http = new DefaultHttpContext();
        http.Request.Headers[InternalApiOptions.HeaderName] = "secret-key";
        var accessor = new HttpContextAccessor { HttpContext = http };
        var handler = new InternalApiKeyAuthorizationHandler(
            Options.Create(new InternalApiOptions { SharedKey = "secret-key" }),
            accessor);

        var authContext = new AuthorizationHandlerContext(
            [new InternalApiKeyRequirement()],
            new System.Security.Claims.ClaimsPrincipal(),
            resource: null);

        await handler.HandleAsync(authContext);
        authContext.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task Fails_when_header_missing_or_wrong()
    {
        var http = new DefaultHttpContext();
        http.Request.Headers[InternalApiOptions.HeaderName] = "wrong";
        var accessor = new HttpContextAccessor { HttpContext = http };
        var handler = new InternalApiKeyAuthorizationHandler(
            Options.Create(new InternalApiOptions { SharedKey = "secret-key" }),
            accessor);

        var authContext = new AuthorizationHandlerContext(
            [new InternalApiKeyRequirement()],
            new System.Security.Claims.ClaimsPrincipal(),
            resource: null);

        await handler.HandleAsync(authContext);
        authContext.HasSucceeded.Should().BeFalse();
    }
}
