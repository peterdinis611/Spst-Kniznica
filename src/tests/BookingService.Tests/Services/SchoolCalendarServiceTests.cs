using System.Net;
using System.Text;
using BookingService.Options;
using BookingService.Services;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using SpstKniznica.Common.Integrations;
using MsOptions = Microsoft.Extensions.Options.Options;

namespace BookingService.Tests.Services;

public class SchoolCalendarServiceTests
{
    [Fact]
    public async Task AdjustDueDateAsync_skips_weekend_when_enabled()
    {
        var sut = CreateSut(
            """[{"date":"2099-01-01","localName":"Test","name":"Test"}]""",
            new LoanPolicyOptions { SkipNonSchoolDays = true, HolidayCountryCode = "SK" });

        // 2026-01-03 is a Saturday
        var saturday = new DateTimeOffset(2026, 1, 3, 12, 0, 0, TimeSpan.Zero);
        var adjusted = await sut.AdjustDueDateAsync(saturday);

        adjusted.UtcDateTime.DayOfWeek.Should().Be(DayOfWeek.Monday);
        adjusted.UtcDateTime.Date.Should().Be(new DateTime(2026, 1, 5));
    }

    [Fact]
    public async Task AdjustDueDateAsync_respects_school_year_end()
    {
        var yearEnd = new DateTimeOffset(2026, 6, 30, 0, 0, 0, TimeSpan.Zero);
        var sut = CreateSut(
            "[]",
            new LoanPolicyOptions
            {
                SkipNonSchoolDays = false,
                SchoolYearEndUtc = yearEnd,
            });

        var due = new DateTimeOffset(2026, 8, 1, 10, 0, 0, TimeSpan.Zero);
        var adjusted = await sut.AdjustDueDateAsync(due);
        adjusted.Should().Be(yearEnd);
    }

    [Fact]
    public async Task IsNonSchoolDayAsync_marks_public_holiday()
    {
        var sut = CreateSut(
            """[{"date":"2026-01-01","localName":"Deň vzniku SR","name":"New Year"}]""",
            new LoanPolicyOptions { SkipNonSchoolDays = true, HolidayCountryCode = "SK" });

        var holiday = await sut.IsNonSchoolDayAsync(new DateOnly(2026, 1, 1));
        var weekday = await sut.IsNonSchoolDayAsync(new DateOnly(2026, 1, 2)); // Friday

        holiday.Should().BeTrue();
        weekday.Should().BeFalse();
    }

    [Fact]
    public async Task GetHolidaysAroundAsync_filters_range()
    {
        var sut = CreateSut(
            """
            [
              {"date":"2026-01-01","localName":"Nový rok","name":"New Year"},
              {"date":"2026-05-01","localName":"Sviatok práce","name":"Labour Day"}
            ]
            """,
            new LoanPolicyOptions { HolidayCountryCode = "SK" });

        var holidays = await sut.GetHolidaysAroundAsync(
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 2, 1));

        holidays.Should().ContainSingle();
        holidays[0].LocalName.Should().Be("Nový rok");
    }

    private static SchoolCalendarService CreateSut(string json, LoanPolicyOptions options)
    {
        var http = new HttpClient(new FixedJsonHandler(json));
        var nager = new NagerDateClient(
            http,
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<NagerDateClient>.Instance);
        return new SchoolCalendarService(nager, MsOptions.Create(options));
    }

    private sealed class FixedJsonHandler(string json) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }
}
