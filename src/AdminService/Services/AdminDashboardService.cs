using AdminService.DTOs;
using SpstKniznica.Common.Auth;

namespace AdminService.Services;

public sealed class AdminDashboardService(AdminDownstreamClient downstream)
{
    public async Task<AdminDashboardDto> GetDashboardAsync(
        System.Security.Claims.ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var checks = await ProbeAllAsync(cancellationToken);
        var roles = user.GetRoles();
        return new AdminDashboardDto
        {
            GeneratedAt = DateTimeOffset.UtcNow.ToString("O"),
            Actor = user.GetDisplayName() ?? "unknown",
            Roles = roles,
            Services = checks,
            HealthyCount = checks.Count(c => c.Healthy),
            UnhealthyCount = checks.Count(c => !c.Healthy),
        };
    }

    public async Task<AdminProbeDto> ProbeAsync(CancellationToken cancellationToken)
    {
        var checks = await ProbeAllAsync(cancellationToken);
        return new AdminProbeDto
        {
            GeneratedAt = DateTimeOffset.UtcNow.ToString("O"),
            Services = checks,
            HealthyCount = checks.Count(c => c.Healthy),
            UnhealthyCount = checks.Count(c => !c.Healthy),
        };
    }

    public ServiceRegistryDto GetRegistry()
    {
        var services = ServiceTargets.All.Select(target =>
        {
            var baseUrl = downstream.ResolveBaseUrl(target.ConfigKey, target.Fallback);
            return new ServiceEndpointDto
            {
                Name = target.Name,
                ConfigKey = target.ConfigKey,
                BaseUrl = baseUrl,
                HealthUrl = $"{baseUrl}/health",
            };
        }).ToList();

        return new ServiceRegistryDto
        {
            GeneratedAt = DateTimeOffset.UtcNow.ToString("O"),
            Services = services,
        };
    }

    private async Task<IReadOnlyList<ServiceHealthDto>> ProbeAllAsync(CancellationToken cancellationToken)
    {
        var probes = await Task.WhenAll(ServiceTargets.All.Select(async target =>
        {
            var result = await downstream.ProbeHealthAsync(
                target.Name,
                target.ConfigKey,
                target.Fallback,
                cancellationToken);
            return new ServiceHealthDto
            {
                Name = result.Name,
                Url = result.Url,
                Healthy = result.Healthy,
                Status = result.Status,
                LatencyMs = result.LatencyMs,
            };
        }));

        return probes;
    }
}
