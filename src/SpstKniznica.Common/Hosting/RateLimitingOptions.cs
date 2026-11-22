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
    /// Set <see cref="AllowMemoryFallback"/> to start anyway with in-process limits.
    /// </summary>
    public bool RequireRedis { get; set; }

    /// <summary>
    /// When true, Redis connection failure falls back to in-memory rate limits instead of
    /// aborting startup — even if <see cref="RequireRedis"/> is true. Use to survive a
    /// frozen Redis on a single host; counters will not be shared across processes.
    /// </summary>
    public bool AllowMemoryFallback { get; set; }

    /// <summary>
    /// When true, anonymous clients are partitioned by the last <c>X-Forwarded-For</c> hop.
    /// The header is ignored unless the TCP peer is listed in <see cref="KnownProxies"/>.
    /// An empty proxy list fails closed and uses the socket address.
    /// </summary>
    public bool TrustForwardedFor { get; set; }

    /// <summary>
    /// Reverse proxies allowed to supply <c>X-Forwarded-For</c>.
    /// Downstream services behind the local gateway use <c>127.0.0.1</c> and <c>::1</c>.
    /// The public gateway stays empty until the school proxy IP is known.
    /// </summary>
    public string[] KnownProxies { get; set; } = [];

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
