using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace SpstKniznica.Common.Auth;

/// <summary>
/// Surfaces audit backlog size for ops (/health).
/// </summary>
public sealed class AuditOutboxHealthCheck(IAuditOutbox outbox) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var pending = outbox.Count();
        var data = new Dictionary<string, object>
        {
            ["pending"] = pending,
            ["sink"] = outbox.Describe,
        };

        if (pending > 100)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                $"audit outbox backlog={pending}",
                data: data));
        }

        if (pending > 20)
        {
            return Task.FromResult(HealthCheckResult.Degraded(
                $"audit outbox backlog={pending}",
                data: data));
        }

        return Task.FromResult(HealthCheckResult.Healthy(
            $"audit outbox pending={pending}",
            data));
    }
}
