namespace BookingService.Interfaces;

public interface ILoanNotificationSender
{
    Task SendDueReminderAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default);

    Task SendWaitlistPromotionAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default);
}

public sealed record LoanNotificationMessage(
    Guid BookingId,
    Guid BookId,
    string BorrowerEmail,
    string BorrowerName,
    DateTimeOffset DueDate);