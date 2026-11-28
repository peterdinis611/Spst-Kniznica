namespace BookingService.Interfaces;

public interface ILoanNotificationSender
{
    Task SendLoanBorrowedAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default);

    Task SendLoanReturnedAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default);

    Task SendDueReminderAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default);

    Task SendWaitlistPromotionAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default);
}

public sealed record LoanNotificationMessage(
    Guid BookingId,
    Guid BookId,
    string BorrowerEmail,
    string BorrowerName,
    DateTimeOffset DueDate,
    string? BookTitle = null,
    DateTimeOffset? BorrowedAt = null,
    DateTimeOffset? ReturnedAt = null);
