namespace BookingService.Options;

public sealed class LoanPolicyOptions
{
    public const string SectionName = "LoanPolicy";

    /// <summary>Default loan length when creating a reservation.</summary>
    public int DefaultLoanDays { get; set; } = 14;

    /// <summary>Max open (Reserved/Active/Overdue) bookings per reader email.</summary>
    public int MaxActiveLoansPerReader { get; set; } = 5;

    /// <summary>Days added on each renew.</summary>
    public int RenewExtraDays { get; set; } = 14;

    /// <summary>How many times a reader may renew one loan.</summary>
    public int MaxRenewals { get; set; } = 1;

    /// <summary>When true, block new reservations (e.g. end of school year).</summary>
    public bool FreezeNewLoans { get; set; }

    /// <summary>Optional hard stop — due dates cannot exceed this instant.</summary>
    public DateTimeOffset? SchoolYearEndUtc { get; set; }

    /// <summary>Days before due date to emit a reminder.</summary>
    public int ReminderDaysBeforeDue { get; set; } = 3;

    /// <summary>Skip weekends + SK public holidays (Nager.Date) when clamping due dates.</summary>
    public bool SkipNonSchoolDays { get; set; } = true;

    /// <summary>ISO country code for Nager.Date (default SK).</summary>
    public string HolidayCountryCode { get; set; } = "SK";
}
