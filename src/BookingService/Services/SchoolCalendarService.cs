using BookingService.Options;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Integrations;

namespace BookingService.Services;

public sealed class SchoolCalendarService(
    NagerDateClient nager,
    IOptions<LoanPolicyOptions> policyOptions)
{
    public async Task<DateTimeOffset> AdjustDueDateAsync(
        DateTimeOffset due,
        CancellationToken cancellationToken = default)
    {
        var policy = policyOptions.Value;
        if (policy.SchoolYearEndUtc is { } yearEnd && due > yearEnd)
        {
            due = yearEnd;
        }

        if (!policy.SkipNonSchoolDays)
        {
            return due;
        }

        // Move to next school day if due lands on weekend/holiday.
        var date = DateOnly.FromDateTime(due.UtcDateTime);
        for (var i = 0; i < 14; i++)
        {
            if (!await IsNonSchoolDayAsync(date, cancellationToken))
            {
                break;
            }

            date = date.AddDays(1);
        }

        if (policy.SchoolYearEndUtc is { } end2)
        {
            var endDate = DateOnly.FromDateTime(end2.UtcDateTime);
            if (date > endDate) date = endDate;
        }

        return new DateTimeOffset(date.ToDateTime(TimeOnly.FromDateTime(due.UtcDateTime), DateTimeKind.Utc));
    }

    public async Task<bool> IsNonSchoolDayAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            return true;
        }

        var country = policyOptions.Value.HolidayCountryCode;
        if (string.IsNullOrWhiteSpace(country)) country = "SK";
        return await nager.IsPublicHolidayAsync(date, country, cancellationToken);
    }

    public async Task<IReadOnlyList<PublicHoliday>> GetHolidaysAroundAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        var country = policyOptions.Value.HolidayCountryCode;
        if (string.IsNullOrWhiteSpace(country)) country = "SK";

        var years = Enumerable.Range(from.Year, Math.Max(1, to.Year - from.Year + 1)).Distinct();
        var all = new List<PublicHoliday>();
        foreach (var year in years)
        {
            var holidays = await nager.GetHolidaysAsync(year, country, cancellationToken);
            all.AddRange(holidays.Where(h => h.Date >= from && h.Date <= to));
        }

        return all.OrderBy(h => h.Date).ToList();
    }
}
