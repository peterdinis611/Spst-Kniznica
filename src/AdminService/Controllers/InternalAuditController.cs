using AdminService.DTOs;
using AdminService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace AdminService.Controllers;

[ApiController]
[Route("api/internal/audit")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.InternalService)]
public class InternalAuditController(AuditLogService auditLogs) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Ingest(
        [FromBody] IngestAuditRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Action)
            || string.IsNullOrWhiteSpace(request.EntityType)
            || string.IsNullOrWhiteSpace(request.EntityId))
        {
            return BadRequest(new { title = "Invalid audit payload" });
        }

        await auditLogs.IngestAsync(request, cancellationToken);
        return NoContent();
    }
}
