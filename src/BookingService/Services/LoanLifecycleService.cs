using BookingService.DTOs;
using BookingService.Interfaces;
using BookingService.Models;
using BookingService.Options;
using Microsoft.Extensions.Options;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace BookingService.Services;

public sealed class LoanLifecycleService(
    IUnitOfWork unitOfWork,
    IAppCache cache,
    IIntegrationEventPublisher eventPublisher,
    IOptions<LoanPolicyOptions> policyOptions,
    WaitlistService waitlist,
    IBookCatalogLookup bookCatalog,
    SchoolCalendarService schoolCalendar,
    ILogger<LoanLifecycleService> logger)
{
    public LoanPolicyDto GetPolicy()
    {
        var p = policyOptions.Value;
        return new LoanPolicyDto
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

    public async Task<LifecycleBatchResult> MarkOverdueAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var pastDue = await unitOfWork.Bookings.ListActivePastDueAsync(now, cancellationToken);
        var ids = new List<Guid>();

        foreach (var booking in pastDue)
        {
            var tracked = await unitOfWork.Bookings.GetTrackedByIdAsync(booking.Id, cancellationToken);
            if (tracked is null || tracked.Status != BookingStatus.Active) continue;

            tracked.Status = BookingStatus.Overdue;
            tracked.UpdatedAt = now;
            unitOfWork.Bookings.Update(tracked);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            await eventPublisher.PublishAsync(
                new BookingUpdatedEvent(
                    tracked.Id,
                    tracked.BookId,
                    tracked.BookCopyId,
                    tracked.BorrowerName,
                    tracked.BorrowerEmail,
                    tracked.Status.ToString(),
                    tracked.DueDate),
                cancellationToken);

            await cache.RemoveAsync(CacheKeys.Booking(tracked.Id), cancellationToken);
            ids.Add(tracked.Id);
            logger.LogInformation("Marked booking {BookingId} overdue", tracked.Id);
        }

        return new LifecycleBatchResult
        {
            MarkedOverdue = ids.Count,
            OverdueIds = ids,
        };
    }

    public async Task<LifecycleBatchResult> QueueDueRemindersAsync(CancellationToken cancellationToken = default)
    {
        var policy = policyOptions.Value;
        var now = DateTimeOffset.UtcNow;
        var windowEnd = now.AddDays(policy.ReminderDaysBeforeDue);
        var dueSoon = await unitOfWork.Bookings.ListDueSoonAsync(now, windowEnd, cancellationToken);
        var reminded = new List<Guid>();

        foreach (var booking in dueSoon)
        {
            if (booking.LastReminderAt is { } last
                && last > now.AddHours(-20))
            {
                continue;
            }

            var tracked = await unitOfWork.Bookings.GetTrackedByIdAsync(booking.Id, cancellationToken);
            if (tracked is null) continue;

            tracked.LastReminderAt = now;
            tracked.UpdatedAt = now;
            unitOfWork.Bookings.Update(tracked);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await cache.RemoveAsync(CacheKeys.Booking(tracked.Id), cancellationToken);

            // Email transport is not wired yet — structured log acts as the notification hook.
            logger.LogInformation(
                "Due reminder for booking {BookingId} to {Email} due {DueDate:o} (book {BookId})",
                tracked.Id,
                tracked.BorrowerEmail,
                tracked.DueDate,
                tracked.BookId);

            reminded.Add(tracked.Id);
        }

        return new LifecycleBatchResult
        {
            RemindersQueued = reminded.Count,
            ReminderBookingIds = reminded,
        };
    }

    public async Task TryPromoteWaitlistAsync(Guid bookId, CancellationToken cancellationToken = default)
    {
        var snapshot = await bookCatalog.GetBookAsync(bookId, cancellationToken);
        var capacity = snapshot?.TotalCopies ?? 1;
        var activeCount = await unitOfWork.Bookings.CountActiveBookingsForBookAsync(
            bookId,
            excludeId: null,
            cancellationToken);
        if (activeCount >= capacity) return;

        var next = await waitlist.DequeueNextAsync(bookId, cancellationToken);
        if (next is null) return;

        var due = await schoolCalendar.AdjustDueDateAsync(
            DateTimeOffset.UtcNow.AddDays(policyOptions.Value.DefaultLoanDays),
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            BorrowerName = next.BorrowerName,
            BorrowerEmail = next.BorrowerEmail,
            Status = BookingStatus.Reserved,
            ReservedAt = now,
            DueDate = due,
            Notes = "Automaticky z čakacieho zoznamu",
            CreatedAt = now,
            UpdatedAt = now,
        };

        await unitOfWork.Bookings.AddAsync(booking, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await eventPublisher.PublishAsync(
            new BookingCreatedEvent(
                booking.Id,
                booking.BookId,
                booking.BookCopyId,
                booking.BorrowerName,
                booking.BorrowerEmail,
                booking.Status.ToString(),
                booking.DueDate),
            cancellationToken);

        logger.LogInformation(
            "Promoted waitlist for book {BookId} → {Email} as booking {BookingId}",
            bookId,
            next.BorrowerEmail,
            booking.Id);
    }

    public async Task<DeskDailyDto> GetDailyBoardAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var soonEnd = now.AddDays(policyOptions.Value.ReminderDaysBeforeDue);

        var pastDueActive = await unitOfWork.Bookings.ListActivePastDueAsync(now, cancellationToken);
        var overduePage = await unitOfWork.Bookings.FindAsync(
            new BookingQueryFilter { Status = BookingStatus.Overdue, Page = 1, PageSize = 50 },
            cancellationToken);
        var dueSoon = await unitOfWork.Bookings.ListDueSoonAsync(now, soonEnd, cancellationToken);
        var reserved = await unitOfWork.Bookings.FindAsync(
            new BookingQueryFilter { Status = BookingStatus.Reserved, Page = 1, PageSize = 50, SortBy = "dueDate" },
            cancellationToken);
        var active = await unitOfWork.Bookings.FindAsync(
            new BookingQueryFilter { Status = BookingStatus.Active, Page = 1, PageSize = 1 },
            cancellationToken);

        var overdueDtos = overduePage.Items.Select(Map)
            .Concat(pastDueActive.Select(Map))
            .GroupBy(b => b.Id)
            .Select(g => g.First())
            .OrderBy(b => b.DueDate)
            .Take(40)
            .ToList();

        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var holidays = await schoolCalendar.GetHolidaysAroundAsync(
            today,
            today.AddDays(30),
            cancellationToken);

        return new DeskDailyDto
        {
            GeneratedAt = now.ToString("O"),
            OverdueCount = overdueDtos.Count,
            DueSoonCount = dueSoon.Count,
            ReservedCount = reserved.TotalCount,
            ActiveCount = active.TotalCount,
            IsNonSchoolDay = await schoolCalendar.IsNonSchoolDayAsync(today, cancellationToken),
            UpcomingHolidays = holidays
                .Select(h => $"{h.Date:yyyy-MM-dd} · {h.LocalName}")
                .Take(8)
                .ToList(),
            Overdue = overdueDtos,
            DueSoon = dueSoon.Take(40).Select(Map).ToList(),
            PickupReady = reserved.Items.Select(Map).Take(40).ToList(),
        };
    }

    private static BookingDto Map(Booking booking) => new()
    {
        Id = booking.Id,
        BookId = booking.BookId,
        BookCopyId = booking.BookCopyId,
        BorrowerName = booking.BorrowerName,
        BorrowerEmail = booking.BorrowerEmail,
        Status = booking.Status,
        ReservedAt = booking.ReservedAt,
        BorrowedAt = booking.BorrowedAt,
        DueDate = booking.DueDate,
        ReturnedAt = booking.ReturnedAt,
        Notes = booking.Notes,
        CreatedAt = booking.CreatedAt,
        UpdatedAt = booking.UpdatedAt,
    };
}
