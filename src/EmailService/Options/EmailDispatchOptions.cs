namespace EmailService.Options;

public sealed class EmailDispatchOptions
{
    public const string SectionName = "EmailDispatch";

    /// <summary>
    /// When non-empty, raw/internal sends are limited to these recipient domains
    /// (e.g. spst.sk). Empty = no domain restriction (Development only recommended).
    /// </summary>
    public string[] AllowedRecipientDomains { get; set; } = [];

    /// <summary>Max outbound messages per rolling minute (all destinations).</summary>
    public int MaxSendsPerMinute { get; set; } = 30;

    /// <summary>
    /// When true, <c>POST api/internal/emails/send</c> requires a non-empty TemplateKey
    /// (blocks free-form phishing bodies). Template endpoints set this automatically.
    /// </summary>
    public bool RequireTemplateKeyForRawSend { get; set; } = true;

    /// <summary>
    /// When false (Production default), client-supplied BodyHtml is rejected.
    /// Built-in react-email templates still attach trusted HTML from <c>Templates/</c>.
    /// </summary>
    public bool AllowBodyHtml { get; set; }

    /// <summary>
    /// Public web origin for CTA links in HTML templates (e.g. http://localhost:3000).
    /// </summary>
    public string PublicSiteUrl { get; set; } = "http://localhost:3000";
}
