using EmailService.DTOs;

namespace EmailService.Services;

public interface IEmailDispatchService
{
    Task<EmailMessageDto> SendAsync(SendEmailRequest request, CancellationToken cancellationToken = default);

    Task<EmailMessageDto> SendLoanDueReminderAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default);

    Task<EmailMessageDto> SendWaitlistPromotionAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EmailMessageDto>> ListRecentAsync(int take, CancellationToken cancellationToken = default);

    Task<EmailMessageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<EmailServiceStatusDto> GetStatusAsync(CancellationToken cancellationToken = default);
}
