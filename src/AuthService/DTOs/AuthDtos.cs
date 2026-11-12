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
