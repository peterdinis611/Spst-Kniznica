namespace SpstKniznica.Common.Hosting;

public class CorsOptions
{
    public const string SectionName = "Cors";
    public const string PolicyName = "SpstCors";

    /// <summary>
    /// When true, allows any origin. Honoured only in Development — ignored elsewhere.
    /// </summary>
    public bool AllowAnyOrigin { get; set; }

    /// <summary>
    /// Public site origin (school URL). Merged into <see cref="AllowedOrigins"/> at startup
    /// so <c>NEXT_PUBLIC_CATALOG_DIRECT</c> browser calls to the gateway succeed.
    /// </summary>
    public string? SiteUrl { get; set; }

    public string[] AllowedOrigins { get; set; } =
    [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5200",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5200"
    ];

    public string[] AllowedMethods { get; set; } =
    [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ];

    public string[] AllowedHeaders { get; set; } =
    [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Trace-Id"
    ];

    public bool AllowCredentials { get; set; }
}
