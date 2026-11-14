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
    public int? LatencyMs { get; init; }
}

public sealed class ServiceRegistryDto
{
    public string GeneratedAt { get; init; } = string.Empty;
    public IReadOnlyList<ServiceEndpointDto> Services { get; init; } = [];
}

public sealed class ServiceEndpointDto
{
    public string Name { get; init; } = string.Empty;
    public string ConfigKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = string.Empty;
    public string HealthUrl { get; init; } = string.Empty;
}

public sealed class AdminOverviewDto
{
    public string GeneratedAt { get; init; } = string.Empty;
    public string Actor { get; init; } = string.Empty;
    public IReadOnlyList<string> Roles { get; init; } = [];
    public CatalogStatsDto Catalog { get; init; } = new();
    public BookingStatsDto Bookings { get; init; } = new();
    public IReadOnlyList<ServiceHealthDto> Services { get; init; } = [];
    public int HealthyCount { get; init; }
    public int UnhealthyCount { get; init; }
    public IReadOnlyList<BookingAttentionDto> Attention { get; init; } = [];
}

public sealed class CatalogStatsDto
{
    public int Books { get; init; }
    public int Authors { get; init; }
    public int Categories { get; init; }
    public int AvailableBooks { get; init; }
    public bool Partial { get; init; }
}

public sealed class BookingStatsDto
{
    public int Total { get; init; }
    public int Reserved { get; init; }
    public int Active { get; init; }
    public int Overdue { get; init; }
    public int Returned { get; init; }
    public int Cancelled { get; init; }
    public bool Partial { get; init; }
}

public sealed class BookingAttentionDto
{
    public Guid Id { get; init; }
    public Guid BookId { get; init; }
    public string BorrowerName { get; init; } = string.Empty;
    public string BorrowerEmail { get; init; } = string.Empty;
    public int Status { get; init; }
    public DateTimeOffset DueDate { get; init; }
}

public sealed class AdminProbeDto
{
    public string GeneratedAt { get; init; } = string.Empty;
    public IReadOnlyList<ServiceHealthDto> Services { get; init; } = [];
    public int HealthyCount { get; init; }
    public int UnhealthyCount { get; init; }
}
