using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Auth;

public sealed class InternalApiKeyRequirement : IAuthorizationRequirement;

public sealed class InternalApiKeyAuthorizationHandler(
    IOptions<InternalApiOptions> options,
    IHttpContextAccessor httpContextAccessor) : AuthorizationHandler<InternalApiKeyRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        InternalApiKeyRequirement requirement)
    {
        var configured = options.Value.SharedKey?.Trim() ?? string.Empty;
        // Empty SharedKey → fail closed (no internal callers succeed).
        if (configured.Length == 0)
        {
            context.Fail();
            return Task.CompletedTask;
        }

        var http = httpContextAccessor.HttpContext;
        if (http is null)
        {
            context.Fail();
            return Task.CompletedTask;
        }

        if (!http.Request.Headers.TryGetValue(InternalApiOptions.HeaderName, out var provided)
            || string.IsNullOrWhiteSpace(provided))
        {
            context.Fail();
            return Task.CompletedTask;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided.ToString().Trim());
        var expectedBytes = Encoding.UTF8.GetBytes(configured);
        if (providedBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes))
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }

        return Task.CompletedTask;
    }
}
