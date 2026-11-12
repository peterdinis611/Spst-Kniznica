using AdminService.DTOs;
using SpstKniznica.Common.Auth;

namespace AdminService.Services;

public sealed class AdminDashboardService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<AdminDashboardService> logger)
{
    private static readonly (string Name, string ConfigKey, string Fallback)[] Targets =
    [
        ("AuthService", "Services:AuthService", "http://127.0.0.1:5210"),
        ("BookService", "Services:BookService", "http://127.0.0.1:5203"),
        ("CategoryService", "Services:CategoryService", "http://127.0.0.1:5204"),
        ("AuthorService", "Services:AuthorService", "http://127.0.0.1:5207"),
        ("BookingService", "Services:BookingService", "http://127.0.0.1:5208"),
        ("WorkersService", "Services:WorkersService", "http://127.0.0.1:5209"),
        ("MessagingService", "Services:MessagingService", "http://127.0.0.1:5205"),
        ("CacheService", "Services:CacheService", "http://127.0.0.1:5206"),
        ("GatewayService", "Services:GatewayService", "http://127.0.0.1:5200"),
    ];

    public async Task<AdminDashboardDto> GetDashboardAsync(
        System.Security.Claims.ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(2);

        var checks = await Task.WhenAll(Targets.Select(async target =>
        {
            var baseUrl = (configuration[target.ConfigKey] ?? target.Fallback).TrimEnd('/');
            var healthUrl = $"{baseUrl}/health";
            try
            {
                using var response = await client.GetAsync(healthUrl, cancellationToken);
                var healthy = response.IsSuccessStatusCode;
                return new ServiceHealthDto
                {
                    Name = target.Name,
                    Url = healthUrl,
                    Healthy = healthy,
                    Status = healthy ? "Healthy" : $"HTTP {(int)response.StatusCode}",
                };
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Health check failed for {Service}", target.Name);
                return new ServiceHealthDto
                {
                    Name = target.Name,
                    Url = healthUrl,
                    Healthy = false,
                    Status = "Unreachable",
                };
            }
        }));

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
}
