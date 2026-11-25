namespace SpstKniznica.Caching;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public bool Enabled { get; set; } = true;
    public string ConnectionString { get; set; } = "localhost:6379";
    public string InstanceName { get; set; } = "spst:";
    public int DefaultTtlSeconds { get; set; } = 300;

    /// <summary>
    /// When <see cref="Enabled"/> and Redis cannot connect, refuse to start instead of
    /// falling back to per-process memory (avoids split-brain across instances).
    /// Recommended true outside Development.
    /// </summary>
    public bool RequireRedis { get; set; }

    /// <summary>
    /// Allow in-process MemoryAppCache when Redis is down even if <see cref="RequireRedis"/> is true.
    /// Single-host emergency only.
    /// </summary>
    public bool AllowMemoryFallback { get; set; }
}
