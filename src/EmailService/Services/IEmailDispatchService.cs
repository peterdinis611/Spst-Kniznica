using EmailService.DTOs;

namespace EmailService.Services;

public interface IEmailDispatchService
{
    Task<EmailMessageDto> SendAsync(SendEmailRequest request, CancellationToken cancellationToken = default);

    Task<EmailMessageDto> SendLoanBorrowedAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default);

    Task<EmailMessageDto> SendLoanReturnedAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default);

    Task<EmailMessageDto> SendLoanDueReminderAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default);

    Task<EmailMessageDto> SendWaitlistPromotionAsync(
        LoanEmailTemplateRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EmailMessageDto>> ListRecentAsync(int take, CancellationToken cancellationToken = default);

    Task<EmailMessageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<EmailMessageDto> ResendAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Re-attempt SMTP for an existing Failed row (durable retry worker).</summary>
    Task<bool> RetryFailedInPlaceAsync(Guid id, CancellationToken cancellationToken = default);

    Task<EmailServiceStatusDto> GetStatusAsync(CancellationToken cancellationToken = default);
}
