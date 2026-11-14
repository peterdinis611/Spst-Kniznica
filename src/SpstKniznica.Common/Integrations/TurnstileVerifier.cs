using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Integrations;

public sealed class TurnstileOptions
{
    public const string SectionName = "Turnstile";

    /// <summary>When false or secret empty, verification is skipped (dev).</summary>
    public bool Enabled { get; set; }

    public string? SecretKey { get; set; }
    public string? SiteKey { get; set; }
}

public sealed class TurnstileVerifier(
    HttpClient http,
    IOptions<TurnstileOptions> options,
    ILogger<TurnstileVerifier> logger)
{
    public bool IsEnforced =>
        options.Value.Enabled && !string.IsNullOrWhiteSpace(options.Value.SecretKey);

    public async Task<bool> VerifyAsync(
        string? token,
        string? remoteIp = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsEnforced)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        try
        {
            using var content = new FormUrlEncodedContent(new Dictionary<string, string?>
            {
                ["secret"] = options.Value.SecretKey,
                ["response"] = token,
                ["remoteip"] = remoteIp,
            }.Where(kv => kv.Value is not null)
             .Select(kv => new KeyValuePair<string, string>(kv.Key, kv.Value!)));

            using var response = await http.PostAsync(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                content,
                cancellationToken);

            if (!response.IsSuccessStatusCode) return false;

            var body = await response.Content.ReadFromJsonAsync<TurnstileResponse>(cancellationToken);
            return body?.Success == true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Turnstile verify failed");
            return false;
        }
    }

    private sealed class TurnstileResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
    }
}
