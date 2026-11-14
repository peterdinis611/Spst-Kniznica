namespace SpstKniznica.Common.Auth;

public sealed class AuditEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
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

public interface IAuditSink
{
    Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default);
}

public sealed class AdminAuditOptions
{
    public const string SectionName = "AdminAudit";

    /// <summary>Base URL of AdminService (e.g. http://127.0.0.1:5211).</summary>
    public string BaseUrl { get; set; } = "http://127.0.0.1:5211";

    public bool Enabled { get; set; } = true;
}
