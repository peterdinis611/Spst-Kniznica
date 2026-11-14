using System.Text.Json;

namespace AdminService.Services;

/// <summary>
/// Outbound calls to sibling microservices. Forwards the caller's Authorization when present.
/// </summary>
public sealed class AdminDownstreamClient(
    IHttpClientFactory httpClientFactory,
    IHttpContextAccessor httpContextAccessor,
    IConfiguration configuration,
    ILogger<AdminDownstreamClient> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public string ResolveBaseUrl(string configKey, string fallback)
        => ServiceTargets.BaseUrl(configuration, configKey, fallback);

    public async Task<ServiceProbeResult> ProbeHealthAsync(
        string name,
        string configKey,
        string fallback,
        CancellationToken cancellationToken)
    {
        var baseUrl = ResolveBaseUrl(configKey, fallback);
        var healthUrl = $"{baseUrl}/health";
        var started = DateTimeOffset.UtcNow;
        try
        {
            var client = httpClientFactory.CreateClient("admin-downstream");
            using var response = await client.GetAsync(healthUrl, cancellationToken);
            var ms = (int)(DateTimeOffset.UtcNow - started).TotalMilliseconds;
            var healthy = response.IsSuccessStatusCode;
            return new ServiceProbeResult(
                name,
                healthUrl,
                healthy,
                healthy ? "Healthy" : $"HTTP {(int)response.StatusCode}",
                ms);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Health check failed for {Service}", name);
            var ms = (int)(DateTimeOffset.UtcNow - started).TotalMilliseconds;
            return new ServiceProbeResult(name, healthUrl, false, "Unreachable", ms);
        }
    }

    public async Task<T?> GetJsonAsync<T>(
        string configKey,
        string fallback,
        string relativePath,
        CancellationToken cancellationToken,
        bool forwardAuth = false)
    {
        var baseUrl = ResolveBaseUrl(configKey, fallback);
        var url = $"{baseUrl}{relativePath}";
        try
        {
            var client = httpClientFactory.CreateClient("admin-downstream");
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (forwardAuth)
            {
                var auth = httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
                if (!string.IsNullOrWhiteSpace(auth))
                {
                    request.Headers.TryAddWithoutValidation("Authorization", auth);
                }
            }

            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogDebug(
                    "Downstream {Url} returned {Status}",
                    url,
                    (int)response.StatusCode);
                return default;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Downstream GET failed for {Url}", url);
            return default;
        }
    }
}

public readonly record struct ServiceProbeResult(
    string Name,
    string Url,
    bool Healthy,
    string Status,
    int LatencyMs);
