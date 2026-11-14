using BookingService.Models;

namespace BookingService.DTOs;

public sealed class LoanPolicyDto
{
    public int DefaultLoanDays { get; init; }
    public int MaxActiveLoansPerReader { get; init; }
    public int RenewExtraDays { get; init; }
    public int MaxRenewals { get; init; }
    public bool FreezeNewLoans { get; init; }
    public DateTimeOffset? SchoolYearEndUtc { get; init; }
    public int ReminderDaysBeforeDue { get; init; }
    public bool SkipNonSchoolDays { get; init; }
    public string HolidayCountryCode { get; init; } = "SK";
}

public sealed class WaitlistEntryDto
{
    public Guid Id { get; init; }
    public Guid BookId { get; init; }
    public string BorrowerName { get; init; } = string.Empty;
    public string BorrowerEmail { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public int Position { get; init; }
    public string? Notes { get; init; }
}

public sealed class JoinWaitlistRequest
{
    public Guid BookId { get; set; }
    public required string BorrowerName { get; set; }
    public required string BorrowerEmail { get; set; }
    public string? Notes { get; set; }
}

public sealed class FavoriteBookDto
{
    public Guid Id { get; init; }
    public Guid BookId { get; init; }
    public string ListName { get; init; } = "Obľúbené";
    public DateTimeOffset CreatedAt { get; init; }
}

public sealed class AddFavoriteRequest
{
    public Guid BookId { get; set; }
    public string? ListName { get; set; }
}

public sealed class DeskDailyDto
{
    public string GeneratedAt { get; init; } = string.Empty;
    public int OverdueCount { get; init; }
    public int DueSoonCount { get; init; }
    public int ReservedCount { get; init; }
    public int ActiveCount { get; init; }
    public bool IsNonSchoolDay { get; init; }
    public IReadOnlyList<string> UpcomingHolidays { get; init; } = [];
    public IReadOnlyList<BookingDto> Overdue { get; init; } = [];
    public IReadOnlyList<BookingDto> DueSoon { get; init; } = [];
    public IReadOnlyList<BookingDto> PickupReady { get; init; } = [];
}

public sealed class LifecycleBatchResult
{
    public int MarkedOverdue { get; init; }
    public int RemindersQueued { get; init; }
    public IReadOnlyList<Guid> OverdueIds { get; init; } = [];
    public IReadOnlyList<Guid> ReminderBookingIds { get; init; } = [];
}

public sealed class RenewBookingRequest
{
    public int? ExtraDays { get; set; }
}
