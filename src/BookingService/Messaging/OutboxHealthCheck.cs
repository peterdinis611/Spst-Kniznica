using BookingService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BookingService.Messaging;

/// <summary>
/// Reports booking integration outbox dead-letters / backlog.
/// </summary>
public sealed class OutboxHealthCheck(BookingDbContext db) : IHealthCheck
{
    private const int MaxAttempts = 20;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var pending = await db.OutboxMessages.CountAsync(
            m => m.ProcessedAt == null && m.AttemptCount < MaxAttempts,
            cancellationToken);
        var dead = await db.OutboxMessages.CountAsync(
            m => m.ProcessedAt == null && m.AttemptCount >= MaxAttempts,
            cancellationToken);

        var data = new Dictionary<string, object>
        {
            ["pending"] = pending,
            ["deadLetter"] = dead,
        };

        if (dead > 10)
        {
            return HealthCheckResult.Unhealthy(
                $"outbox dead-letter={dead}, pending={pending}",
                data: data);
        }

        if (dead > 0 || pending > 50)
        {
            return HealthCheckResult.Degraded(
                $"outbox dead-letter={dead}, pending={pending}",
                data: data);
        }

        return HealthCheckResult.Healthy(
            $"outbox pending={pending}, dead-letter={dead}",
            data);
    }
}
