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
public class AdminController(
    AdminDashboardService dashboard,
    AdminOverviewService overview) : ControllerBase
{
    /// <summary>Health overview of sibling services (with latency).</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard(CancellationToken cancellationToken)
    {
        var result = await dashboard.GetDashboardAsync(User, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Aggregated ops overview: catalog counts, booking stats, health, attention list.
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(AdminOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminOverviewDto>> Overview(CancellationToken cancellationToken)
    {
        var result = await overview.GetOverviewAsync(User, cancellationToken);
        return Ok(result);
    }

    /// <summary>Configured downstream service base URLs.</summary>
    [HttpGet("services")]
    [ProducesResponseType(typeof(ServiceRegistryDto), StatusCodes.Status200OK)]
    public ActionResult<ServiceRegistryDto> Services()
        => Ok(dashboard.GetRegistry());

    /// <summary>Live health probe of all known services.</summary>
    [HttpGet("probe")]
    [ProducesResponseType(typeof(AdminProbeDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminProbeDto>> Probe(CancellationToken cancellationToken)
        => Ok(await dashboard.ProbeAsync(cancellationToken));

    /// <summary>Bookings that need staff attention (overdue + due soon).</summary>
    [HttpGet("attention")]
    [ProducesResponseType(typeof(IReadOnlyList<BookingAttentionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BookingAttentionDto>>> Attention(
        CancellationToken cancellationToken)
        => Ok(await overview.GetAttentionAsync(cancellationToken));

    [HttpGet("whoami")]
    public ActionResult<object> WhoAmI()
    {
        return Ok(new
        {
            id = User.GetObjectId(),
            name = User.GetDisplayName(),
            email = User.GetEmail(),
            roles = User.GetRoles(),
            isStaff = User.IsStaff(),
            isAdmin = User.IsInRole(AppRoles.Admin)
                || User.GetRoles().Any(r =>
                    r.Equals(AppRoles.Admin, StringComparison.OrdinalIgnoreCase)),
        });
    }

    [HttpGet("ping")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public ActionResult<object> AdminPing()
        => Ok(new { ok = true, role = AppRoles.Admin, at = DateTimeOffset.UtcNow });
}
