namespace SpstKniznica.Common.Hosting;

public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>Global edge limiter (all requests except health/swagger).</summary>
    public bool EnableGlobalLimiter { get; set; } = true;

    /// <summary>
    /// When true, use Redis fixed-window counters shared across instances.
    /// Falls back to in-memory when Redis is unavailable or UseRedis is false —
    /// unless <see cref="RequireRedis"/> is true.
    /// </summary>
    public bool UseRedis { get; set; }

    /// <summary>
    /// When true with <see cref="UseRedis"/>, startup fails if Redis cannot be connected
    /// (fail-closed). Recommended for Production.
    /// </summary>
    public bool RequireRedis { get; set; }

    /// <summary>
    /// When true, partition anonymous clients by the first <c>X-Forwarded-For</c> hop.
    /// Only enable behind a trusted reverse proxy that overwrites that header.
    /// </summary>
    public bool TrustForwardedFor { get; set; }

    /// <summary>Optional override; defaults to Cache:ConnectionString.</summary>
    public string? RedisConnectionString { get; set; }

    public int GlobalPermitLimit { get; set; } = 120;
    public int GlobalWindowSeconds { get; set; } = 60;

    public int PublicReadPermitLimit { get; set; } = 90;
    public int PublicReadWindowSeconds { get; set; } = 60;

    public int SensitiveWritePermitLimit { get; set; } = 40;
    public int SensitiveWriteWindowSeconds { get; set; } = 60;

    /// <summary>Bulk CSV/XML downloads — keep low to limit mass exfiltration.</summary>
    public int DataExportPermitLimit { get; set; } = 8;
    public int DataExportWindowSeconds { get; set; } = 60;
}
