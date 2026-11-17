namespace EmailService.Options;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    /// <summary>
    /// When false, emails are recorded and logged but not handed to SMTP.
    /// </summary>
    public bool Enabled { get; set; }

    public string Host { get; set; } = "localhost";

    public int Port { get; set; } = 1025;

    public bool UseSsl { get; set; }

    public string? Username { get; set; }

    public string? Password { get; set; }

    public string FromAddress { get; set; } = "kniznica@spst.sk";

    public string FromDisplayName { get; set; } = "SPST Knižnica";

    public int TimeoutSeconds { get; set; } = 30;
}
