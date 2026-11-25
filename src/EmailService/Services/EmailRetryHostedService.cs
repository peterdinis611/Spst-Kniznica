using EmailService.Data;
using EmailService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Hosting;

namespace EmailService.Services;

/// <summary>
/// Retries Failed email rows (SMTP/outage) so reminders are not silently lost.
/// </summary>
public sealed class EmailRetryHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<EmailRetryHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);
    private const int BatchSize = 20;
    private const int MaxAttempts = 8;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RetryBatchAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Email retry cycle failed");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RetryBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<EmailDbContext>();
        var emails = scope.ServiceProvider.GetRequiredService<IEmailDispatchService>();
        var metrics = scope.ServiceProvider.GetService<RequestMetrics>();

        var failed = await db.Messages
            .AsNoTracking()
            .Where(m => m.Status == EmailDeliveryStatus.Failed && m.AttemptCount < MaxAttempts)
            .OrderBy(m => m.CreatedAt.UtcTicks)
            .Take(BatchSize)
            .Select(m => m.Id)
            .ToListAsync(cancellationToken);

        metrics?.SetGauge("email_failed_pending", failed.Count);
        if (failed.Count == 0)
        {
            var deadOnly = await db.Messages.CountAsync(
                m => m.Status == EmailDeliveryStatus.Failed && m.AttemptCount >= MaxAttempts,
                cancellationToken);
            metrics?.SetGauge("email_dead_letter", deadOnly);
            return;
        }

        foreach (var id in failed)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var ok = await emails.RetryFailedInPlaceAsync(id, cancellationToken);
            if (ok)
            {
                metrics?.IncrementCounter("email_retry_success");
            }
            else
            {
                metrics?.IncrementCounter("email_retry_failed");
            }
        }

        var dead = await db.Messages.CountAsync(
            m => m.Status == EmailDeliveryStatus.Failed && m.AttemptCount >= MaxAttempts,
            cancellationToken);
        metrics?.SetGauge("email_dead_letter", dead);
        if (dead > 0)
        {
            logger.LogError(
                "Email dead-letter: {Count} messages exceeded {MaxAttempts} attempts",
                dead,
                MaxAttempts);
        }
    }
}
