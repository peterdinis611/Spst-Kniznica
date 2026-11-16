namespace AuthService.DTOs;

public sealed class AuthConfigDto
{
    public bool Enabled { get; init; }
    public string TenantId { get; init; } = string.Empty;
    public string ClientId { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string ApiScope { get; init; } = string.Empty;
    public string Authority { get; init; } = string.Empty;
    public string RedirectUriHint { get; init; } = "http://localhost:3000/login";
    public string? LoginNotice { get; init; }
}

public sealed class AuthUserDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Email { get; init; }
    public IReadOnlyList<string> Roles { get; init; } = [];
    public bool IsAuthenticated { get; init; }
    public bool IsStaff { get; init; }
    public bool IsAdmin { get; init; }
}

/// <summary>Admin view: Entra (read-only) + editable presentation overrides.</summary>
public sealed class AuthSettingsDto
{
    public bool Enabled { get; init; }
    public string TenantId { get; init; } = string.Empty;
    public string ClientId { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string ApiScope { get; init; } = string.Empty;
    public string Authority { get; init; } = string.Empty;
    public bool GrantStaffInDevelopment { get; init; }

    public string RedirectUriHint { get; init; } = "http://localhost:3000/login";
    public string? LoginNotice { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public bool HasOverrides { get; init; }
}

public sealed class UpdateAuthSettingsRequest
{
    public required string RedirectUriHint { get; set; }
    public string? LoginNotice { get; set; }
}
