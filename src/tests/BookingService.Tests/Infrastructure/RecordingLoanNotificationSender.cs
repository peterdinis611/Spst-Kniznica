using BookingService.Interfaces;

namespace BookingService.Tests.Infrastructure;

public sealed class RecordingLoanNotificationSender : ILoanNotificationSender
{
    public List<LoanNotificationMessage> DueReminders { get; } = [];
    public List<LoanNotificationMessage> WaitlistPromotions { get; } = [];

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