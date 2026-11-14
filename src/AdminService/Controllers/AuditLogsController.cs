using AdminService.DTOs;
using AdminService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Export;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Pagination;

namespace AdminService.Controllers;

[ApiController]
[Route("api/admin/audit-logs")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.Staff)]
public class AuditLogsController(AuditLogService auditLogs, IAuditLogger audit) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> List(
        [FromQuery] AuditLogQuery query,
        CancellationToken cancellationToken)
        => Ok(await auditLogs.SearchAsync(query, cancellationToken));

    [HttpGet("export")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.DataExportPolicy)]
    [Produces("text/csv", "application/xml")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Export(
        [FromQuery] AuditLogQuery query,
        [FromQuery] ExportQuery export,
        CancellationToken cancellationToken)
    {
        export.Normalize();
        var items = await auditLogs.ListForExportAsync(query, export.Take, cancellationToken);

        string[] headers =
        [
            "id", "occurredAt", "action", "entityType", "entityId",
            "actorEmail", "actorName", "roles", "sourceService", "detailsJson",
        ];

        var rows = items.Select(x => (IReadOnlyList<string?>)
        [
            SecureTabularExport.Cell(x.Id),
            SecureTabularExport.Cell(x.OccurredAt),
            SecureTabularExport.Cell(x.Action),
            SecureTabularExport.Cell(x.EntityType),
            SecureTabularExport.Cell(x.EntityId),
            SecureTabularExport.Cell(x.ActorEmail),
            SecureTabularExport.Cell(x.ActorName),
            SecureTabularExport.Cell(x.Roles),
            SecureTabularExport.Cell(x.SourceService),
            SecureTabularExport.Cell(x.DetailsJson),
        ]);

        audit.StaffAction(User, "audit.export", "AuditLog", export.Format, new
        {
            export.Format,
            Count = items.Count,
            Cap = export.Take,
        });

        return ExportFileResult.Create(
            this,
            export.ResolvedFormat,
            "audit-logs",
            headers,
            rows,
            "auditLogs",
            "entry");
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuditLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuditLogDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var item = await auditLogs.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }
}
