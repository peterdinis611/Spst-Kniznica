using AdminService.DTOs;
using AdminService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Pagination;

namespace AdminService.Controllers;

[ApiController]
[Route("api/admin/audit-logs")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.Staff)]
public class AuditLogsController(AuditLogService auditLogs) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> List(
        [FromQuery] AuditLogQuery query,
        CancellationToken cancellationToken)
        => Ok(await auditLogs.SearchAsync(query, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuditLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuditLogDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var item = await auditLogs.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }
}
