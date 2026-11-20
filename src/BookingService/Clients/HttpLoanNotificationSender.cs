using System.Net.Http.Json;
using BookingService.Interfaces;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace BookingService.Clients;

public sealed class EmailServiceOptions
{
    public const string SectionName = "Services";

    public string EmailService { get; set; } = "http://127.0.0.1:5212";
}

/// <summary>
/// Posts loan templates to EmailService internal API. Failures are logged and swallowed
/// so booking lifecycle never fails on SMTP/outage.
/// </summary>
internal sealed class HttpLoanNotificationSender(
    HttpClient httpClient,
    IOptions<InternalApiOptions> internalApi,
    ILogger<HttpLoanNotificationSender> logger) : ILoanNotificationSender
{
    private sealed class TemplateBody
    {
        public Guid BookingId { get; set; }
        public Guid BookId { get; set; }
        public string BorrowerEmail { get; set; } = string.Empty;
        public string BorrowerName { get; set; } = string.Empty;
        public DateTimeOffset DueDate { get; set; }
        public string? BookTitle { get; set; }
    }

    public Task SendDueReminderAsync(
        LoanNotificationMessage message,
        CancellationToken cancellationToken = default)
        => PostTemplateAsync(
            "api/internal/emails/templates/loan-due-reminder",
            message,
            cancellationToken);

    public Task SendWaitlistPromotionAsync(
        LoanNotificationMessage message,
        CancellationToken cancellationToken = default)
        => PostTemplateAsync(
            "api/internal/emails/templates/waitlist-promotion",
            message,
            cancellationToken);

    private async Task PostTemplateAsync(
        string path,
        LoanNotificationMessage message,
        CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, path);
            var key = internalApi.Value.SharedKey?.Trim();
            if (!string.IsNullOrEmpty(key))
            {
                request.Headers.TryAddWithoutValidation(InternalApiOptions.HeaderName, key);
            }

            request.Content = JsonContent.Create(new TemplateBody
            {
                BookingId = message.BookingId,
                BookId = message.BookId,
                BorrowerEmail = message.BorrowerEmail,
                BorrowerName = message.BorrowerName,
                DueDate = message.DueDate,
            });

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "EmailService {Path} returned {Status} for booking {BookingId}",
                    path,
                    (int)response.StatusCode,
                    message.BookingId);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(
                ex,
                "EmailService notify failed ({Path}) for booking {BookingId}",
                path,
                message.BookingId);
        }
    }
}
