using EmailService.Data;
using EmailService.DTOs;
using EmailService.Models;
using EmailService.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Text;

namespace EmailService.Services;

public sealed class EmailDispatchService(
    EmailDbContext db,
    IEmailTransport transport,
    IOptions<SmtpOptions> smtpOptions,
    IOptions<EmailDispatchOptions> dispatchOptions,
    ILogger<EmailDispatchService> logger) : IEmailDispatchService
{
    public async Task<EmailMessageDto> SendAsync(
        SendEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        var policy = dispatchOptions.Value;
        var to = NormalizeEmail(request.To);
        var subject = StringNormalize.Required(request.Subject);
        var body = StringNormalize.Required(request.BodyText);
        var templateKey = string.IsNullOrWhiteSpace(request.TemplateKey)
            ? null
            : request.TemplateKey.Trim();

        if (policy.RequireTemplateKeyForRawSend && string.IsNullOrWhiteSpace(templateKey))
        {
            throw new ArgumentException(
                "TemplateKey is required for internal email send. Use a template endpoint or set TemplateKey.");
        }

        EnsureRecipientAllowed(to, policy);
        await EnsureWithinSendQuotaAsync(policy, cancellationToken);

        var log = new EmailMessageLog
        {
            Id = Guid.NewGuid(),
            ToAddress = to,
            ToName = string.IsNullOrWhiteSpace(request.ToName)
                ? null
                : request.ToName.Trim(),
            Subject = subject,
            BodyText = body,
            BodyHtml = string.IsNullOrWhiteSpace(request.BodyHtml)
                ? null
                : request.BodyHtml,
            TemplateKey = templateKey,
            CorrelationId = string.IsNullOrWhiteSpace(request.CorrelationId)
                ? null
                : request.CorrelationId.Trim(),
            Status = EmailDeliveryStatus.Queued,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.Messages.Add(log);
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            await transport.SendAsync(
                new OutboundEmail(
                    log.ToAddress,
                    log.ToName,
                    log.Subject,
                    log.BodyText,
                    log.BodyHtml),
                cancellationToken);

            log.Status = transport.IsLive
                ? EmailDeliveryStatus.Sent
                : EmailDeliveryStatus.LoggedOnly;
            log.SentAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to dispatch email {EmailId} to {To}", log.Id, log.ToAddress);
            log.Status = EmailDeliveryStatus.Failed;
            log.Error = Truncate(ex.Message, 2000);
            await db.SaveChangesAsync(cancellationToken);
            throw;
        }

        return ToDto(log);
    }

    public Task<EmailMessageDto> SendLoanDueReminderAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = DisplayName(request.BorrowerName);
        var title = string.IsNullOrWhiteSpace(request.BookTitle) ? "titul" : request.BookTitle.Trim();
        var due = request.DueDate.ToLocalTime().ToString("d. M. yyyy");

        return SendAsync(
            new SendEmailRequest
            {
                To = request.BorrowerEmail,
                ToName = name,
                Subject = $"Pripomienka: termín vrátenia ({due})",
                BodyText =
                    $"Ahoj {name},\n\n" +
                    $"pripomíname termín vrátenia knihy „{title}“: {due}.\n\n" +
                    "Ak potrebuješ predĺženie, požiadaj oň v Mojej knižnici.\n\n" +
                    "SPST Knižnica",
                TemplateKey = "loan-due-reminder",
                CorrelationId = request.BookingId.ToString("N"),
            },
            cancellationToken);
    }

    public Task<EmailMessageDto> SendWaitlistPromotionAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = DisplayName(request.BorrowerName);
        var title = string.IsNullOrWhiteSpace(request.BookTitle) ? "titul" : request.BookTitle.Trim();
        var due = request.DueDate.ToLocalTime().ToString("d. M. yyyy");

        return SendAsync(
            new SendEmailRequest
            {
                To = request.BorrowerEmail,
                ToName = name,
                Subject = $"Kniha je pripravená: {title}",
                BodyText =
                    $"Ahoj {name},\n\n" +
                    $"titul „{title}“ je pre teba rezervovaný. Vyzdvihni ho do {due}.\n\n" +
                    "SPST Knižnica",
                TemplateKey = "waitlist-promotion",
                CorrelationId = request.BookingId.ToString("N"),
            },
            cancellationToken);
    }

    public async Task<IReadOnlyList<EmailMessageDto>> ListRecentAsync(
        int take,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(take, 1, 100);
        var items = await db.Messages
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
        return items.Select(ToDto).ToList();
    }

    public async Task<EmailMessageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await db.Messages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return item is null ? null : ToDto(item);
    }

    public async Task<EmailServiceStatusDto> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var smtp = smtpOptions.Value;
        var recent = await db.Messages.CountAsync(cancellationToken);
        return new EmailServiceStatusDto
        {
            SmtpEnabled = smtp.Enabled,
            FromAddress = smtp.FromAddress,
            Host = smtp.Host,
            Port = smtp.Port,
            RecentCount = recent,
        };
    }

    private static EmailMessageDto ToDto(EmailMessageLog log) => new()
    {
        Id = log.Id,
        ToAddress = log.ToAddress,
        ToName = log.ToName,
        Subject = log.Subject,
        TemplateKey = log.TemplateKey,
        CorrelationId = log.CorrelationId,
        Status = log.Status,
        Error = log.Error,
        CreatedAt = log.CreatedAt,
        SentAt = log.SentAt,
    };

    private static void EnsureRecipientAllowed(string to, EmailDispatchOptions policy)
    {
        if (policy.AllowedRecipientDomains is not { Length: > 0 })
        {
            return;
        }

        var at = to.LastIndexOf('@');
        if (at < 0 || at >= to.Length - 1)
        {
            throw new ArgumentException("Invalid recipient email address.");
        }

        var domain = to[(at + 1)..];
        var allowed = policy.AllowedRecipientDomains.Any(d =>
            string.Equals(d.Trim().TrimStart('@'), domain, StringComparison.OrdinalIgnoreCase));

        if (!allowed)
        {
            throw new ArgumentException(
                $"Recipient domain '{domain}' is not in EmailDispatch:AllowedRecipientDomains.");
        }
    }

    private async Task EnsureWithinSendQuotaAsync(
        EmailDispatchOptions policy,
        CancellationToken cancellationToken)
    {
        var limit = Math.Max(1, policy.MaxSendsPerMinute);
        var since = DateTimeOffset.UtcNow.AddMinutes(-1);
        var recent = await db.Messages.CountAsync(m => m.CreatedAt >= since, cancellationToken);
        if (recent >= limit)
        {
            throw new InvalidOperationException(
                $"Email send rate limit exceeded ({limit}/min). Retry later.");
        }
    }

    private static string NormalizeEmail(string email)
        => StringNormalize.Required(email).ToLowerInvariant();

    private static string DisplayName(string? name)
        => string.IsNullOrWhiteSpace(name) ? "čitateľ" : name.Trim();

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max];
}
