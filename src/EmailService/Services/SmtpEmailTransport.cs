using EmailService.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace EmailService.Services;

public sealed class SmtpEmailTransport(
    IOptions<SmtpOptions> options,
    ILogger<SmtpEmailTransport> logger) : IEmailTransport
{
    private readonly SmtpOptions _options = options.Value;

    public bool IsLive => true;

    public async Task SendAsync(OutboundEmail email, CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromDisplayName, _options.FromAddress));
        message.To.Add(new MailboxAddress(
            string.IsNullOrWhiteSpace(email.ToName) ? email.ToAddress : email.ToName!,
            email.ToAddress));
        message.Subject = email.Subject;

        var builder = new BodyBuilder { TextBody = email.BodyText };
        if (!string.IsNullOrWhiteSpace(email.BodyHtml))
        {
            builder.HtmlBody = email.BodyHtml;
        }

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = Math.Max(5, _options.TimeoutSeconds) * 1000;

        var secure = _options.UseSsl
            ? SecureSocketOptions.StartTlsWhenAvailable
            : SecureSocketOptions.None;

        await client.ConnectAsync(_options.Host, _options.Port, secure, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            await client.AuthenticateAsync(_options.Username, _options.Password ?? string.Empty, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation(
            "Email sent via SMTP → {To} | {Subject}",
            email.ToAddress,
            email.Subject);
    }
}
