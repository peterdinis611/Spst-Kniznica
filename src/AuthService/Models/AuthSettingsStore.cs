namespace AuthService.Models;

/// <summary>Single-row runtime overrides for AuthService presentation settings.</summary>
public sealed class AuthSettingsStore
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public string RedirectUriHint { get; set; } = "http://localhost:3000/login";

    /// <summary>Optional Slovak notice shown on the login page.</summary>
    public string? LoginNotice { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
