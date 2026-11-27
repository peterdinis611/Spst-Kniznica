namespace SpstKniznica.Common.Hosting;

public sealed class MetricsOptions
{
    public const string SectionName = "Metrics";

    /// <summary>
    /// When true, <c>/metrics</c> requires <c>X-Metrics-Key</c> (or InternalApi shared key).
    /// Production should set this true.
    /// </summary>
    public bool RequireKey { get; set; }

    /// <summary>
    /// Dedicated metrics scrape key. Falls back to <c>InternalApi:SharedKey</c> when empty.
    /// </summary>
    public string? ApiKey { get; set; }
}
