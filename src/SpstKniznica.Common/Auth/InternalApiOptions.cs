namespace SpstKniznica.Common.Auth;

public sealed class InternalApiOptions
{
    public const string SectionName = "InternalApi";
    public const string HeaderName = "X-Internal-Api-Key";

    /// <summary>
    /// Shared secret for service-to-service calls. Empty = internal endpoints reject all callers.
    /// </summary>
    public string SharedKey { get; set; } = string.Empty;
}
