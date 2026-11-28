using System.ComponentModel.DataAnnotations;
using EmailService.Models;

namespace EmailService.DTOs;

public sealed class SendEmailRequest
{
    [Required, EmailAddress, MaxLength(320)]
    public string To { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ToName { get; set; }

    [Required, MaxLength(500)]
    public string Subject { get; set; } = string.Empty;

    [Required, MaxLength(50_000)]
    public string BodyText { get; set; } = string.Empty;

    [MaxLength(100_000)]
    public string? BodyHtml { get; set; }

    [MaxLength(100)]
    public string? TemplateKey { get; set; }

    [MaxLength(100)]
    public string? CorrelationId { get; set; }
}

public sealed class LoanEmailTemplateRequest
{
    [Required]
    public Guid BookingId { get; set; }

    [Required]
    public Guid BookId { get; set; }

    [Required, EmailAddress, MaxLength(320)]
    public string BorrowerEmail { get; set; } = string.Empty;

    [MaxLength(200)]
    public string BorrowerName { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset DueDate { get; set; }

    [MaxLength(300)]
    public string? BookTitle { get; set; }

    public DateTimeOffset? BorrowedAt { get; set; }

    public DateTimeOffset? ReturnedAt { get; set; }
}

public sealed class EmailMessageDto
{
    public Guid Id { get; set; }
    public string ToAddress { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? TemplateKey { get; set; }
    public string? CorrelationId { get; set; }
    public EmailDeliveryStatus Status { get; set; }
    public string? Error { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? SentAt { get; set; }
}

public sealed class EmailServiceStatusDto
{
    public bool SmtpEnabled { get; set; }
    public string FromAddress { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public int RecentCount { get; set; }
}
