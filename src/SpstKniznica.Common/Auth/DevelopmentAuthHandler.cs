using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Auth;

public sealed class DevelopmentAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IHostEnvironment environment) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Development";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Hard stop: never elevate (or even succeed as a synthetic principal) outside Development.
        if (!environment.IsDevelopment())
        {
            Logger.LogError(
                "DevelopmentAuthHandler invoked outside Development ({Environment}) — rejecting.",
                environment.EnvironmentName);
            return Task.FromResult(AuthenticateResult.Fail("Development auth is not available."));
        }

        // Default local principal is a reader. Opt into staff with SPST_DEV_ADMIN=1.
        var elevate =
            string.Equals(
                Environment.GetEnvironmentVariable("SPST_DEV_ADMIN"),
                "1",
                StringComparison.Ordinal)
            || string.Equals(
                Environment.GetEnvironmentVariable("SPST_DEV_ADMIN"),
                "true",
                StringComparison.OrdinalIgnoreCase);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, elevate ? "dev-admin" : "dev-reader"),
            new(ClaimTypes.Name, elevate ? "Dev Admin" : "Dev Reader"),
            new(ClaimTypes.Email, elevate ? "admin@spst.local" : "reader@spst.local"),
            new("preferred_username", elevate ? "admin@spst.local" : "reader@spst.local"),
            new(ClaimTypes.Role, AppRoles.Reader),
        };

        if (elevate)
        {
            Logger.LogWarning(
                "SPST_DEV_ADMIN is set — issuing Development Admin+Librarian principal.");
            claims.Add(new Claim(ClaimTypes.Role, AppRoles.Librarian));
            claims.Add(new Claim(ClaimTypes.Role, AppRoles.Admin));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
