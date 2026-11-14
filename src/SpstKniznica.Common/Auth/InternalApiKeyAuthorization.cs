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
        if (configured.Length == 0)
        {
            return Task.CompletedTask;
        }

        var http = httpContextAccessor.HttpContext;
        if (http is null)
        {
            return Task.CompletedTask;
        }

        if (!http.Request.Headers.TryGetValue(InternalApiOptions.HeaderName, out var provided)
            || string.IsNullOrWhiteSpace(provided))
        {
            return Task.CompletedTask;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided.ToString().Trim());
        var expectedBytes = Encoding.UTF8.GetBytes(configured);
        if (providedBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
