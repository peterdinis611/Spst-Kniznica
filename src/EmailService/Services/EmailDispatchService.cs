using EmailService.Data;
using EmailService.DTOs;
using EmailService.Models;
using EmailService.Options;
using EmailService.Templating;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Text;

namespace EmailService.Services;

public sealed class EmailDispatchService(
    EmailDbContext db,
    IEmailTransport transport,
    IOptions<SmtpOptions> smtpOptions,
    IOptions<EmailDispatchOptions> dispatchOptions,
    LoanEmailHtmlRenderer htmlTemplates,
    IAuditLogger audit,
    ILogger<EmailDispatchService> logger) : IEmailDispatchService
{
    public Task<EmailMessageDto> SendAsync(
        SendEmailRequest request,
        CancellationToken cancellationToken = default)
        => SendAsync(request, cancellationToken, trustServerHtml: false);

    private async Task<EmailMessageDto> SendAsync(
        SendEmailRequest request,
        CancellationToken cancellationToken,
        bool trustServerHtml)
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

        if (!HtmlSafety.IsPlainText(subject) || !HtmlSafety.IsPlainText(body))
        {
            throw new ArgumentException("Email subject/body must be plain text (no HTML markup).");
        }

        string? bodyHtml = null;
        if (!string.IsNullOrWhiteSpace(request.BodyHtml))
        {
            if (!trustServerHtml && !policy.AllowBodyHtml)
            {
                throw new ArgumentException(
                    "BodyHtml is disabled. Set EmailDispatch:AllowBodyHtml=true only when intentionally sending HTML.");
            }

            if (!HtmlSafety.IsSafeHtmlFragment(request.BodyHtml))
            {
                throw new ArgumentException(
                    "BodyHtml contains disallowed active content (script/iframe/event handlers).");
            }

            bodyHtml = request.BodyHtml;
        }

        var log = new EmailMessageLog
        {
            Id = Guid.NewGuid(),
            ToAddress = to,
            ToName = string.IsNullOrWhiteSpace(request.ToName)
                ? null
                : request.ToName.Trim(),
            Subject = subject,
            BodyText = body,
            BodyHtml = bodyHtml,
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
            WriteSendAudit(log, failed: false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to dispatch email {EmailId} to {To}", log.Id, log.ToAddress);
            log.Status = EmailDeliveryStatus.Failed;
            log.Error = Truncate(ex.Message, 2000);
            log.AttemptCount = Math.Max(1, log.AttemptCount + 1);
            await db.SaveChangesAsync(cancellationToken);
            WriteSendAudit(log, failed: true);
            throw;
        }

        return ToDto(log);
    }

    public Task<EmailMessageDto> SendLoanBorrowedAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = DisplayName(request.BorrowerName);
        var title = BookTitle(request.BookTitle);
        var due = FormatDate(request.DueDate);
        var borrowed = FormatDate(request.BorrowedAt ?? DateTimeOffset.UtcNow);

        return SendTemplatedAsync(
            request,
            templateKey: "loan-borrowed",
            subject: $"Požičané: {title} (vráť do {due})",
            bodyText:
                $"Ahoj {name},\n\n" +
                $"kniha „{title}“ je požičaná.\n" +
                $"Vydané: {borrowed}\n" +
                $"Vrátiť do: {due}\n\n" +
                "SPST Knižnica",
            tokens: LoanTokens(request, name, title, due, borrowedAt: borrowed),
            cancellationToken);
    }

    public Task<EmailMessageDto> SendLoanReturnedAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = DisplayName(request.BorrowerName);
        var title = BookTitle(request.BookTitle);
        var returned = FormatDate(request.ReturnedAt ?? DateTimeOffset.UtcNow);

        return SendTemplatedAsync(
            request,
            templateKey: "loan-returned",
            subject: $"Vrátené: {title}",
            bodyText:
                $"Ahoj {name},\n\n" +
                $"ďakujeme za vrátenie knihy „{title}“ ({returned}).\n\n" +
                "SPST Knižnica",
            tokens: LoanTokens(request, name, title, FormatDate(request.DueDate), returnedAt: returned),
            cancellationToken);
    }

    public Task<EmailMessageDto> SendLoanDueReminderAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = DisplayName(request.BorrowerName);
        var title = BookTitle(request.BookTitle);
        var due = FormatDate(request.DueDate);

        return SendTemplatedAsync(
            request,
            templateKey: "loan-due-reminder",
            subject: $"Pripomienka: termín vrátenia ({due})",
            bodyText:
                $"Ahoj {name},\n\n" +
                $"pripomíname termín vrátenia knihy „{title}“: {due}.\n\n" +
                "Ak potrebuješ predĺženie, požiadaj oň v Mojej knižnici.\n\n" +
                "SPST Knižnica",
            tokens: LoanTokens(request, name, title, due),
            cancellationToken);
    }

    public Task<EmailMessageDto> SendWaitlistPromotionAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = DisplayName(request.BorrowerName);
        var title = BookTitle(request.BookTitle);
        var due = FormatDate(request.DueDate);

        return SendTemplatedAsync(
            request,
            templateKey: "waitlist-promotion",
            subject: $"Kniha je pripravená: {title}",
            bodyText:
                $"Ahoj {name},\n\n" +
                $"titul „{title}“ je pre teba rezervovaný. Vyzdvihni ho do {due}.\n\n" +
                "SPST Knižnica",
            tokens: LoanTokens(request, name, title, due),
            cancellationToken);
    }

    private Task<EmailMessageDto> SendTemplatedAsync(
        LoanEmailTemplateRequest request,
        string templateKey,
        string subject,
        string bodyText,
        IReadOnlyDictionary<string, string> tokens,
        CancellationToken cancellationToken)
    {
        // Trusted react-email HTML — bypasses AllowBodyHtml (client BodyHtml still gated).
        var bodyHtml = htmlTemplates.TryRender(templateKey, tokens);

        return SendAsync(
            new SendEmailRequest
            {
                To = request.BorrowerEmail,
                ToName = DisplayName(request.BorrowerName),
                Subject = subject,
                BodyText = bodyText,
                BodyHtml = bodyHtml,
                TemplateKey = templateKey,
                CorrelationId = request.BookingId.ToString("N"),
            },
            cancellationToken,
            trustServerHtml: bodyHtml is not null);
    }

    private Dictionary<string, string> LoanTokens(
        LoanEmailTemplateRequest request,
        string name,
        string title,
        string due,
        string? borrowedAt = null,
        string? returnedAt = null)
    {
        var site = (dispatchOptions.Value.PublicSiteUrl ?? "http://localhost:3000").TrimEnd('/');
        return new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["BorrowerName"] = name,
            ["BookTitle"] = title,
            ["DueDate"] = due,
            ["BorrowedAt"] = borrowedAt ?? FormatDate(request.BorrowedAt ?? DateTimeOffset.UtcNow),
            ["ReturnedAt"] = returnedAt ?? FormatDate(request.ReturnedAt ?? DateTimeOffset.UtcNow),
            ["CatalogUrl"] = $"{site}/books",
            ["MyLibraryUrl"] = $"{site}/bookings",
        };
    }

    public async Task<IReadOnlyList<EmailMessageDto>> ListRecentAsync(
        int take,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(take, 1, 100);
        // Cap client materialization — EF SQLite cannot ORDER BY DateTimeOffset.
        var items = await db.Messages.AsNoTracking()
            .Take(Math.Max(limit * 20, 500))
            .ToListAsync(cancellationToken);
        return items
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .Select(ToDto)
            .ToList();
    }

    public async Task<EmailMessageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await db.Messages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return item is null ? null : ToDto(item);
    }

    public async Task<EmailMessageDto> ResendAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await db.Messages.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Email message '{id}' was not found.");

        return await SendAsync(
            new SendEmailRequest
            {
                To = existing.ToAddress,
                ToName = existing.ToName,
                Subject = existing.Subject,
                BodyText = existing.BodyText,
                BodyHtml = existing.BodyHtml,
                TemplateKey = existing.TemplateKey ?? "resend",
                CorrelationId = existing.CorrelationId ?? existing.Id.ToString("N"),
            },
            cancellationToken,
            trustServerHtml: IsKnownLoanTemplate(existing.TemplateKey));
    }

    private static bool IsKnownLoanTemplate(string? templateKey) => templateKey is
        "loan-borrowed" or "loan-returned" or "loan-due-reminder" or "waitlist-promotion";

    public async Task<bool> RetryFailedInPlaceAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var log = await db.Messages.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (log is null || log.Status != EmailDeliveryStatus.Failed)
        {
            return false;
        }

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
            log.Error = null;
            log.AttemptCount += 1;
            await db.SaveChangesAsync(cancellationToken);
            WriteSendAudit(log, failed: false);
            return true;
        }
        catch (Exception ex)
        {
            log.AttemptCount += 1;
            log.Error = Truncate(ex.Message, 2000);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogWarning(ex, "In-place email retry failed for {EmailId}", id);
            return false;
        }
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

    private void WriteSendAudit(EmailMessageLog log, bool failed)
    {
        var action = failed
            ? "email.failed"
            : ResolveSuccessAction(log.TemplateKey);

        audit.ServiceAction(
            action,
            "EmailMessage",
            log.Id.ToString(),
            new
            {
                log.TemplateKey,
                Status = log.Status.ToString(),
                log.CorrelationId,
                ToDomain = RecipientDomain(log.ToAddress),
                Subject = Truncate(log.Subject, 120),
                DeliveryMode = transport.IsLive ? "smtp" : "log-only",
                Error = failed ? Truncate(log.Error ?? string.Empty, 240) : null,
            });
    }

    private static string ResolveSuccessAction(string? templateKey) => templateKey switch
    {
        "loan-borrowed" => "email.template.loan-borrowed",
        "loan-returned" => "email.template.loan-returned",
        "loan-due-reminder" => "email.template.loan-due-reminder",
        "waitlist-promotion" => "email.template.waitlist-promotion",
        _ => "email.send",
    };

    private static string? RecipientDomain(string to)
    {
        var at = to.LastIndexOf('@');
        return at < 0 || at >= to.Length - 1 ? null : to[(at + 1)..];
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
        // SQLite EF cannot translate DateTimeOffset comparisons — evaluate on the client.
        var recent = (await db.Messages.AsNoTracking().ToListAsync(cancellationToken))
            .Count(m => m.CreatedAt >= since);
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

    private static string BookTitle(string? title)
        => string.IsNullOrWhiteSpace(title) ? "titul" : title.Trim();

    private static string FormatDate(DateTimeOffset value)
        => value.ToLocalTime().ToString("d. M. yyyy");

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max];
}
