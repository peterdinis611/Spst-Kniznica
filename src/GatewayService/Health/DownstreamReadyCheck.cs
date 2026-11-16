using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace GatewayService.Health;

/// <summary>
/// Probes a downstream /health endpoint so gateway readiness reflects real deps.
/// </summary>
public sealed class DownstreamReadyCheck(string name, string healthUrl, IHttpClientFactory httpClientFactory)
    : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var client = httpClientFactory.CreateClient("gateway-ready");
            using var response = await client.GetAsync(healthUrl, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return HealthCheckResult.Healthy($"{name} OK");
            }

            return HealthCheckResult.Unhealthy(
                $"{name} returned {(int)response.StatusCode}");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy($"{name} unreachable", ex);
        }
    }
}
