using AdminService.DTOs;
using AdminService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace AdminService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.Staff)]
public class AdminController(AdminDashboardService dashboard) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard(CancellationToken cancellationToken)
    {
        var result = await dashboard.GetDashboardAsync(User, cancellationToken);
        return Ok(result);
    }

    [HttpGet("whoami")]
    public ActionResult<object> WhoAmI()
    {
        return Ok(new
        {
            id = User.GetObjectId(),
            name = User.GetDisplayName(),
            email = User.GetEmail(),
            roles = User.GetRoles(),
        });
    }

    [HttpGet("ping")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public ActionResult<object> AdminPing()
        => Ok(new { ok = true, role = AppRoles.Admin, at = DateTimeOffset.UtcNow });
}
