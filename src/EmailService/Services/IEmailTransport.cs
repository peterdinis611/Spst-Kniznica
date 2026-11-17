namespace EmailService.Services;

public sealed record OutboundEmail(
    string ToAddress,
    string? ToName,
    string Subject,
    string BodyText,
    string? BodyHtml);

public interface IEmailTransport
{
    bool IsLive { get; }

    Task SendAsync(OutboundEmail email, CancellationToken cancellationToken = default);
}
