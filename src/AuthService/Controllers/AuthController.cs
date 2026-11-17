using AuthService.DTOs;
using AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(IAuthSettingsProvider settings, IAuditLogger audit) : ControllerBase
{
    [HttpGet("config")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthConfigDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthConfigDto>> Config(CancellationToken cancellationToken)
        => Ok(await settings.GetPublicConfigAsync(cancellationToken));

    [HttpGet("settings")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [ProducesResponseType(typeof(AuthSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthSettingsDto>> GetSettings(CancellationToken cancellationToken)
        => Ok(await settings.GetSettingsAsync(cancellationToken));

    [HttpPut("settings")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [ProducesResponseType(typeof(AuthSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthSettingsDto>> UpdateSettings(
        [FromBody] UpdateAuthSettingsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var saved = await settings.SaveOverridesAsync(request, cancellationToken);
            audit.StaffAction(User, "auth.settings.update", "AuthSettings", "singleton", new
            {
                saved.RedirectUriHint,
                HasLoginNotice = !string.IsNullOrWhiteSpace(saved.LoginNotice),
                saved.HasOverrides,
                saved.UpdatedAt,
            });
            return Ok(saved);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
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
