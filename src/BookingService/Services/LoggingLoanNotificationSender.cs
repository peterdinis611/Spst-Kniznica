namespace BookingService.Services;

/// <summary>
/// Default notification transport — structured logs until SMTP is enabled.
/// </summary>
public sealed class LoggingLoanNotificationSender(ILogger<LoggingLoanNotificationSender> logger)
    : Interfaces.ILoanNotificationSender
{
    public Task SendDueReminderAsync(
        Interfaces.LoanNotificationMessage message,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Loan due reminder: booking {BookingId}, book {BookId}, borrower {Email}, due {DueDate:o}",
            message.BookingId,
            message.BookId,
            message.BorrowerEmail,
            message.DueDate);
        return Task.CompletedTask;
    }

    public Task SendWaitlistPromotionAsync(
        Interfaces.LoanNotificationMessage message,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Waitlist pickup ready: booking {BookingId}, book {BookId}, borrower {Email}, pickup by {DueDate:o}",
            message.BookingId,
            message.BookId,
            message.BorrowerEmail,
            message.DueDate);
        return Task.CompletedTask;
    }
}