using AuthService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(IOptions<EntraOptions> entraOptions) : ControllerBase
{
    [HttpGet("config")]
    [AllowAnonymous]
    public ActionResult<AuthConfigDto> Config()
    {
        var entra = entraOptions.Value;
        return Ok(new AuthConfigDto
        {
            Enabled = entra.Enabled,
            TenantId = entra.TenantId,
            ClientId = entra.ClientId,
            Audience = string.IsNullOrWhiteSpace(entra.Audience)
                ? (string.IsNullOrWhiteSpace(entra.ClientId) ? string.Empty : $"api://{entra.ClientId}")
                : entra.Audience,
            ApiScope = string.IsNullOrWhiteSpace(entra.ApiScope) && !string.IsNullOrWhiteSpace(entra.ClientId)
                ? $"api://{entra.ClientId}/access_as_user"
                : entra.ApiScope,
            Authority = entra.Enabled ? entra.Authority : string.Empty,
            RedirectUriHint = "http://localhost:3000/login",
        });
    }

    [HttpGet("me")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    public ActionResult<AuthUserDto> Me()
    {
        var roles = User.GetRoles();
        return Ok(new AuthUserDto
        {
            Id = User.GetObjectId() ?? string.Empty,
            Name = User.GetDisplayName() ?? "User",
            Email = User.GetEmail(),
            Roles = roles,
            IsAuthenticated = User.Identity?.IsAuthenticated == true,
            IsStaff = roles.Contains(AppRoles.Librarian, StringComparer.OrdinalIgnoreCase)
                      || roles.Contains(AppRoles.Admin, StringComparer.OrdinalIgnoreCase),
            IsAdmin = roles.Contains(AppRoles.Admin, StringComparer.OrdinalIgnoreCase),
        });
    }
}
