namespace SpstKniznica.Common.Auth;

public sealed class EntraOptions
{
    public const string SectionName = "Entra";

    /// <summary>
    /// When false, Development authentication is used (local Admin principal).
    /// </summary>
    public bool Enabled { get; set; }

    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// API Application ID URI / audience, e.g. api://{client-id}.
    /// </summary>
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// Scope exposed by the API app registration, e.g. api://{client-id}/access_as_user.
    /// </summary>
    public string ApiScope { get; set; } = string.Empty;

    public string Instance { get; set; } = "https://login.microsoftonline.com/";

    /// <summary>
    /// Development only. When true and the access token has no Admin/Librarian
    /// app roles yet, inject staff roles so local /admin works before Azure
    /// role assignment is finished.
    /// </summary>
    public bool GrantStaffInDevelopment { get; set; }

    public string Authority =>
        $"{Instance.TrimEnd('/')}/{TenantId}/v2.0";
}
