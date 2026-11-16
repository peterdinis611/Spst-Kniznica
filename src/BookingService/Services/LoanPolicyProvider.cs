using BookingService.Data;
using BookingService.DTOs;
using BookingService.Models;
using BookingService.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BookingService.Services;

public interface ILoanPolicyProvider
{
    Task<LoanPolicyOptions> GetEffectiveAsync(CancellationToken cancellationToken = default);
    Task<LoanPolicyDto> GetPolicyDtoAsync(CancellationToken cancellationToken = default);
    Task<LoanPolicyDto> SaveOverridesAsync(
        UpdateLoanPolicyRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class LoanPolicyProvider(
    BookingDbContext db,
    IOptions<LoanPolicyOptions> configuredOptions) : ILoanPolicyProvider
{
    private LoanPolicyOptions? _cached;

    public async Task<LoanPolicyOptions> GetEffectiveAsync(CancellationToken cancellationToken = default)
    {
        if (_cached is not null) return _cached;

        var merged = configuredOptions.Value;
        var row = await db.LoanPolicyStore.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == LoanPolicyStore.SingletonId, cancellationToken);
        if (row is not null)
        {
            merged = Merge(configuredOptions.Value, row);
        }

        _cached = merged;
        return merged;
    }

    public async Task<LoanPolicyDto> GetPolicyDtoAsync(CancellationToken cancellationToken = default)
    {
        var p = await GetEffectiveAsync(cancellationToken);
        return ToDto(p);
    }

    public async Task<LoanPolicyDto> SaveOverridesAsync(
        UpdateLoanPolicyRequest request,
        CancellationToken cancellationToken = default)
    {
        var row = await db.LoanPolicyStore
            .FirstOrDefaultAsync(s => s.Id == LoanPolicyStore.SingletonId, cancellationToken);

        if (row is null)
        {
            row = new LoanPolicyStore { Id = LoanPolicyStore.SingletonId };
            db.LoanPolicyStore.Add(row);
        }

        row.DefaultLoanDays = request.DefaultLoanDays;
        row.MaxActiveLoansPerReader = request.MaxActiveLoansPerReader;
        row.RenewExtraDays = request.RenewExtraDays;
        row.MaxRenewals = request.MaxRenewals;
        row.FreezeNewLoans = request.FreezeNewLoans;
        row.SchoolYearEndUtc = request.SchoolYearEndUtc;
        row.ReminderDaysBeforeDue = request.ReminderDaysBeforeDue;
        row.SkipNonSchoolDays = request.SkipNonSchoolDays;
        row.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        _cached = null;

        return await GetPolicyDtoAsync(cancellationToken);
    }

    private static LoanPolicyOptions Merge(LoanPolicyOptions baseline, LoanPolicyStore row) =>
        new()
        {
            DefaultLoanDays = row.DefaultLoanDays,
            MaxActiveLoansPerReader = row.MaxActiveLoansPerReader,
            RenewExtraDays = row.RenewExtraDays,
            MaxRenewals = row.MaxRenewals,
            FreezeNewLoans = row.FreezeNewLoans,
            SchoolYearEndUtc = row.SchoolYearEndUtc,
            ReminderDaysBeforeDue = row.ReminderDaysBeforeDue,
            SkipNonSchoolDays = row.SkipNonSchoolDays,
            HolidayCountryCode = baseline.HolidayCountryCode,
        };

    private static LoanPolicyDto ToDto(LoanPolicyOptions p) => new()
    {
        DefaultLoanDays = p.DefaultLoanDays,
        MaxActiveLoansPerReader = p.MaxActiveLoansPerReader,
        RenewExtraDays = p.RenewExtraDays,
        MaxRenewals = p.MaxRenewals,
        FreezeNewLoans = p.FreezeNewLoans,
        SchoolYearEndUtc = p.SchoolYearEndUtc,
        ReminderDaysBeforeDue = p.ReminderDaysBeforeDue,
        SkipNonSchoolDays = p.SkipNonSchoolDays,
        HolidayCountryCode = p.HolidayCountryCode,
    };
}