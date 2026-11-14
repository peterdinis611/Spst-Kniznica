using SpstKniznica.Common.Pagination;

namespace AdminService.DTOs;

public sealed class AuditLogDto
{
    public Guid Id { get; init; }
    public DateTimeOffset OccurredAt { get; init; }
    public string Action { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public string EntityId { get; init; } = string.Empty;
    public string? ActorIdHash { get; init; }
    public string? ActorEmail { get; init; }
    public string? ActorName { get; init; }
    public string Roles { get; init; } = string.Empty;
    public string? DetailsJson { get; init; }
    public string? SourceService { get; init; }
}

public sealed class AuditLogQuery : PagedQuery
{
    public AuditLogQuery()
    {
        SortBy = "occurredAt";
        SortDir = "desc";
    }

    public string? Action { get; set; }
    public string? EntityType { get; set; }
    public string? ActorEmail { get; set; }
    public string? SourceService { get; set; }
}

public sealed class IngestAuditRequest
{
    public Guid? Id { get; set; }
    public DateTimeOffset? OccurredAt { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public required string EntityId { get; set; }
    public string? ActorIdHash { get; set; }
    public string? ActorEmail { get; set; }
    public string? ActorName { get; set; }
    public string? Roles { get; set; }
    public string? DetailsJson { get; set; }
    public string? SourceService { get; set; }
}
