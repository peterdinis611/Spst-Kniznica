namespace AdminService.Models;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? ActorIdHash { get; set; }
    public string? ActorEmail { get; set; }
    public string? ActorName { get; set; }
    public string Roles { get; set; } = string.Empty;
    public string? DetailsJson { get; set; }
    public string? SourceService { get; set; }
}
