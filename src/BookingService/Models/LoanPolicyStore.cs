namespace BookingService.Models;

/// <summary>Single-row runtime overrides for loan policy (Id is always 1).</summary>
public sealed class LoanPolicyStore
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public int DefaultLoanDays { get; set; }
    public int MaxActiveLoansPerReader { get; set; }
    public int RenewExtraDays { get; set; }
    public int MaxRenewals { get; set; }
    public bool FreezeNewLoans { get; set; }
    public DateTimeOffset? SchoolYearEndUtc { get; set; }
    public int ReminderDaysBeforeDue { get; set; }
    public bool SkipNonSchoolDays { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}