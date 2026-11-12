namespace AdminService.DTOs;

public sealed class AdminDashboardDto
{
    public string GeneratedAt { get; init; } = string.Empty;
    public string Actor { get; init; } = string.Empty;
    public IReadOnlyList<string> Roles { get; init; } = [];
    public IReadOnlyList<ServiceHealthDto> Services { get; init; } = [];
    public int HealthyCount { get; init; }
    public int UnhealthyCount { get; init; }
}

public sealed class ServiceHealthDto
{
    public string Name { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public bool Healthy { get; init; }
    public string Status { get; init; } = string.Empty;
}
