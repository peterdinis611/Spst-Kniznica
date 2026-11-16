namespace SpstKniznica.Common.Auth;

public sealed class InternalApiOptions
{
    public const string SectionName = "InternalApi";
    public const string HeaderName = "X-Internal-Api-Key";

    /// <summary>
    /// Shared secret for service-to-service calls. Empty = internal endpoints reject all callers.
    /// </summary>
    public string SharedKey { get; set; } = string.Empty;

    /// <summary>
    /// Development only. Must be explicitly true to allow the well-known local placeholder key.
    /// </summary>
    public bool AllowInsecureDefaultKey { get; set; }
}
