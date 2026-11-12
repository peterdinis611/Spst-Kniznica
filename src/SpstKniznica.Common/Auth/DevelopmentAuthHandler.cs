using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Auth;

public sealed class DevelopmentAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Development";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, "dev-admin"),
                new Claim(ClaimTypes.Name, "Dev Admin"),
                new Claim(ClaimTypes.Email, "admin@spst.local"),
                new Claim("preferred_username", "admin@spst.local"),
                new Claim(ClaimTypes.Role, AppRoles.Admin),
                new Claim(ClaimTypes.Role, AppRoles.Librarian),
                new Claim(ClaimTypes.Role, AppRoles.Reader),
            ],
            SchemeName);

        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
