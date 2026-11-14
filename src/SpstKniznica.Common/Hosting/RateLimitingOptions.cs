namespace SpstKniznica.Common.Hosting;

public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>Global edge limiter (all requests except health/swagger).</summary>
    public bool EnableGlobalLimiter { get; set; } = true;

    public int GlobalPermitLimit { get; set; } = 120;
    public int GlobalWindowSeconds { get; set; } = 60;

    public int PublicReadPermitLimit { get; set; } = 90;
    public int PublicReadWindowSeconds { get; set; } = 60;

    public int SensitiveWritePermitLimit { get; set; } = 40;
    public int SensitiveWriteWindowSeconds { get; set; } = 60;
}
