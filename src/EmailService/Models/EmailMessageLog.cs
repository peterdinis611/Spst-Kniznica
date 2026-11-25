namespace EmailService.Models;

public enum EmailDeliveryStatus
{
    Queued = 0,
    Sent = 1,
    Failed = 2,
    LoggedOnly = 3,
}

public sealed class EmailMessageLog
{
    public Guid Id { get; set; }

    public string ToAddress { get; set; } = string.Empty;

    public string? ToName { get; set; }

    public string Subject { get; set; } = string.Empty;

    public string BodyText { get; set; } = string.Empty;

    public string? BodyHtml { get; set; }

    public string? TemplateKey { get; set; }

    public string? CorrelationId { get; set; }

    public EmailDeliveryStatus Status { get; set; }

    public string? Error { get; set; }

    /// <summary>Dispatch + automatic retry attempts (Failed → retry worker).</summary>
    public int AttemptCount { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? SentAt { get; set; }
}
