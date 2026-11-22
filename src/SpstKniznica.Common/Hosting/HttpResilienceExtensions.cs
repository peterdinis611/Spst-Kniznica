using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Polly-based HTTP resilience via <c>Microsoft.Extensions.Http.Resilience</c>
/// (retry + timeout + circuit breaker). Prefer this over raw <c>HttpClient.Timeout</c>.
/// </summary>
public static class HttpResilienceExtensions
{
    /// <summary>Internal service-to-service calls (catalog, booking sync, audit).</summary>
    public static IHttpClientBuilder AddSpstResilience(this IHttpClientBuilder builder)
        => AddSpstResilience(builder, attemptTimeoutSeconds: 5, totalTimeoutSeconds: 20, maxRetryAttempts: 2);

    /// <summary>External/slow dependencies (Open Library, WorldCat, workers lifecycle).</summary>
    public static IHttpClientBuilder AddSpstResilienceExternal(this IHttpClientBuilder builder)
        => AddSpstResilience(builder, attemptTimeoutSeconds: 8, totalTimeoutSeconds: 30, maxRetryAttempts: 2);

    /// <summary>Fast probes — one retry only (downstream admin/health-ish calls).</summary>
    public static IHttpClientBuilder AddSpstResilienceTight(this IHttpClientBuilder builder)
        => AddSpstResilience(builder, attemptTimeoutSeconds: 3, totalTimeoutSeconds: 8, maxRetryAttempts: 1);

    public static IHttpClientBuilder AddSpstResilience(
        this IHttpClientBuilder builder,
        double attemptTimeoutSeconds,
        double totalTimeoutSeconds,
        int maxRetryAttempts)
    {
        ArgumentNullException.ThrowIfNull(builder);
        if (attemptTimeoutSeconds <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(attemptTimeoutSeconds));
        }

        if (totalTimeoutSeconds < attemptTimeoutSeconds)
        {
            throw new ArgumentOutOfRangeException(
                nameof(totalTimeoutSeconds),
                "Total timeout must be >= attempt timeout.");
        }

        // Pipeline owns timeouts — HttpClient.Timeout must not fight it.
        builder.ConfigureHttpClient(static client =>
        {
            client.Timeout = Timeout.InfiniteTimeSpan;
        });

        builder.AddStandardResilienceHandler(options =>
        {
            options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(attemptTimeoutSeconds);
            options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(totalTimeoutSeconds);
            options.Retry.MaxRetryAttempts = Math.Clamp(maxRetryAttempts, 0, 5);

            // Polly requires SamplingDuration >= 2 × AttemptTimeout.
            var minSampling = TimeSpan.FromSeconds(attemptTimeoutSeconds * 2 + 1);
            if (options.CircuitBreaker.SamplingDuration < minSampling)
            {
                options.CircuitBreaker.SamplingDuration = minSampling;
            }
        });

        return builder;
    }
}
