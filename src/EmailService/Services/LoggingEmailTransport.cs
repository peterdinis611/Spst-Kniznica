namespace EmailService.Services;

/// <summary>
/// Dev / disabled-SMTP transport — structured logs only, no network send.
/// </summary>
public sealed class LoggingEmailTransport(ILogger<LoggingEmailTransport> logger) : IEmailTransport
{
    public bool IsLive => false;

    public Task SendAsync(OutboundEmail email, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Email (log-only) → {To} | {Subject} | {Preview}",
            email.ToAddress,
            email.Subject,
            Truncate(email.BodyText, 160));
        return Task.CompletedTask;
    }

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max] + "…";
}
