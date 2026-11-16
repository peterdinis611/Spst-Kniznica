using BookingService.DTOs;
using BookingService.Options;
using BookingService.Services;

namespace BookingService.Tests.Infrastructure;

internal sealed class FixedLoanPolicyProvider(LoanPolicyOptions options) : ILoanPolicyProvider
{
    public Task<LoanPolicyOptions> GetEffectiveAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(options);

    public Task<LoanPolicyDto> GetPolicyDtoAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LoanPolicyDto
        {
            DefaultLoanDays = options.DefaultLoanDays,
            MaxActiveLoansPerReader = options.MaxActiveLoansPerReader,
            RenewExtraDays = options.RenewExtraDays,
            MaxRenewals = options.MaxRenewals,
            FreezeNewLoans = options.FreezeNewLoans,
            SchoolYearEndUtc = options.SchoolYearEndUtc,
            ReminderDaysBeforeDue = options.ReminderDaysBeforeDue,
            SkipNonSchoolDays = options.SkipNonSchoolDays,
            HolidayCountryCode = options.HolidayCountryCode,
        });
    }

    public Task<LoanPolicyDto> SaveOverridesAsync(
        UpdateLoanPolicyRequest request,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException();
}