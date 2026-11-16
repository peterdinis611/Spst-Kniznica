namespace AuthService.Options;

public sealed class AuthPresentationOptions
{
    public const string SectionName = "AuthPresentation";

    public string RedirectUriHint { get; set; } = "http://localhost:3000/login";
    public string? LoginNotice { get; set; }
}
