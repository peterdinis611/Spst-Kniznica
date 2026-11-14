using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace WorkersService.Jobs;

public sealed class LoanLifecycleOptions
{
    public const string SectionName = "LoanLifecycle";

    public bool Enabled { get; set; } = true;
    public int IntervalSeconds { get; set; } = 300;
    public string BookingService { get; set; } = "http://127.0.0.1:5208";
}

/// <summary>
/// Periodically marks overdue loans and queues due-soon reminders via BookingService internal API.
/// </summary>
public sealed class LoanLifecycleHostedService(
    IHttpClientFactory httpClientFactory,
    IOptions<LoanLifecycleOptions> options,
    IOptions<InternalApiOptions> internalApi,
    ILogger<LoanLifecycleHostedService> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var opts = options.Value;
        if (!opts.Enabled)
        {
            logger.LogInformation("Loan lifecycle worker disabled");
            return;
        }

        var delay = TimeSpan.FromSeconds(Math.Clamp(opts.IntervalSeconds, 30, 3600));
        logger.LogInformation(
            "Loan lifecycle worker started (every {Seconds}s → {BookingService})",
            delay.TotalSeconds,
            opts.BookingService);

        // Initial delay so BookingService can boot.
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCycleAsync(opts, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Loan lifecycle cycle failed");
            }

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RunCycleAsync(LoanLifecycleOptions opts, CancellationToken cancellationToken)
    {
        var overdue = await PostAsync(opts, "/api/internal/bookings/mark-overdue", cancellationToken);
        var reminders = await PostAsync(opts, "/api/internal/bookings/due-reminders", cancellationToken);

        logger.LogInformation(
            "Loan lifecycle cycle: overdue={Overdue}, reminders={Reminders}",
            overdue?.MarkedOverdue ?? 0,
            reminders?.RemindersQueued ?? 0);
    }

    private async Task<BatchResult?> PostAsync(
        LoanLifecycleOptions opts,
        string path,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("loan-lifecycle");
        var baseUrl = opts.BookingService.TrimEnd('/');
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}{path}");
        var key = internalApi.Value.SharedKey;
        if (!string.IsNullOrWhiteSpace(key))
        {
            request.Headers.TryAddWithoutValidation(InternalApiOptions.HeaderName, key);
        }

        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Lifecycle call {Path} failed with {Status}",
                path,
                (int)response.StatusCode);
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonSerializer.DeserializeAsync<BatchResult>(stream, JsonOptions, cancellationToken);
    }

    private sealed class BatchResult
    {
        public int MarkedOverdue { get; set; }
        public int RemindersQueued { get; set; }
    }
}
