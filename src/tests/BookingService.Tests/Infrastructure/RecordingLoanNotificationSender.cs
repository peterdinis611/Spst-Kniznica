using BookingService.Interfaces;

namespace BookingService.Tests.Infrastructure;

public sealed class RecordingLoanNotificationSender : ILoanNotificationSender
{
    public List<LoanNotificationMessage> Borrowed { get; } = [];
    public List<LoanNotificationMessage> Returned { get; } = [];
    public List<LoanNotificationMessage> DueReminders { get; } = [];
    public List<LoanNotificationMessage> WaitlistPromotions { get; } = [];

    public Task SendLoanBorrowedAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default)
    {
        Borrowed.Add(message);
        return Task.CompletedTask;
    }

    public Task SendLoanReturnedAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default)
    {
        Returned.Add(message);
        return Task.CompletedTask;
    }

    public Task SendDueReminderAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default)
    {
        DueReminders.Add(message);
        return Task.CompletedTask;
    }

    public Task SendWaitlistPromotionAsync(LoanNotificationMessage message, CancellationToken cancellationToken = default)
    {
        WaitlistPromotions.Add(message);
        return Task.CompletedTask;
    }
}
