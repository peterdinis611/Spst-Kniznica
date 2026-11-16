using BookingService.Clients;
using BookingService.Data;
using BookingService.DTOs;
using BookingService.Interfaces;
using BookingService.Models;
using BookingService.Options;
using BookingService.Repositories;
using BookingService.Services;
using BookingService.Tests.Infrastructure;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Integrations;
using SpstKniznica.Common.Messaging;

namespace BookingService.Tests.Services;

public class LoanLifecycleServiceTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private BookingDbContext _db = null!;
    private LoanLifecycleService _sut = null!;
    private RecordingEventPublisher _events = null!;
    private IBookCatalogLookup _bookCatalog = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new BookingDbContext(options);
        await _db.Database.EnsureCreatedAsync();
        _events = new RecordingEventPublisher();
        _bookCatalog = Substitute.For<IBookCatalogLookup>();
        _sut = CreateSut(_db, _bookCatalog, _events);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task MarkOverdueAsync_marks_active_past_due_loans()
    {
        var pastDue = SeedBooking(status: BookingStatus.Active, dueDaysFromNow: -2);
        var future = SeedBooking(status: BookingStatus.Active, dueDaysFromNow: 5);
        await _db.SaveChangesAsync();

        var result = await _sut.MarkOverdueAsync();

        result.MarkedOverdue.Should().Be(1);
        result.OverdueIds.Should().ContainSingle().Which.Should().Be(pastDue.Id);

        var tracked = await _db.Bookings.AsNoTracking().FirstAsync(b => b.Id == pastDue.Id);
        tracked.Status.Should().Be(BookingStatus.Overdue);

        var stillActive = await _db.Bookings.AsNoTracking().FirstAsync(b => b.Id == future.Id);
        stillActive.Status.Should().Be(BookingStatus.Active);
        _events.Events.Should().ContainSingle(e => e is BookingUpdatedEvent);
    }

    [Fact]
    public async Task GetDailyBoardAsync_aggregates_overdue_due_soon_and_reserved()
    {
        var policy = new LoanPolicyOptions
        {
            ReminderDaysBeforeDue = 3,
            SkipNonSchoolDays = false,
            HolidayCountryCode = "SK",
        };
        _sut = CreateSut(_db, _bookCatalog, _events, policy);

        SeedBooking(status: BookingStatus.Overdue, dueDaysFromNow: -5);
        SeedBooking(status: BookingStatus.Active, dueDaysFromNow: -1);
        SeedBooking(status: BookingStatus.Active, dueDaysFromNow: 2);
        SeedBooking(status: BookingStatus.Reserved, dueDaysFromNow: 4);
        await _db.SaveChangesAsync();

        var board = await _sut.GetDailyBoardAsync();

        board.OverdueCount.Should().BeGreaterThanOrEqualTo(2);
        board.DueSoonCount.Should().BeGreaterThanOrEqualTo(1);
        board.ReservedCount.Should().BeGreaterThanOrEqualTo(1);
        board.Overdue.Should().NotBeEmpty();
        board.DueSoon.Should().NotBeEmpty();
        board.PickupReady.Should().NotBeEmpty();
    }

    [Fact]
    public async Task TryPromoteWaitlistAsync_creates_reserved_booking_when_slot_opens()
    {
        var bookId = Guid.NewGuid();
        _bookCatalog.GetBookAsync(bookId, Arg.Any<CancellationToken>())
            .Returns(new BookAvailabilitySnapshot(2, 1));

        _db.Waitlist.Add(new WaitlistEntry
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            BorrowerName = "Čakateľ",
            BorrowerEmail = "waiter@spst.sk",
            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
        });
        await _db.SaveChangesAsync();

        await _sut.TryPromoteWaitlistAsync(bookId);

        (await _db.Waitlist.CountAsync()).Should().Be(0);
        var promoted = await _db.Bookings.SingleAsync(b => b.BookId == bookId);
        promoted.BorrowerEmail.Should().Be("waiter@spst.sk");
        promoted.Status.Should().Be(BookingStatus.Reserved);
        promoted.Notes.Should().Contain("čakacieho zoznamu");
        _events.Events.Should().ContainSingle(e => e is BookingCreatedEvent);
    }

    [Fact]
    public async Task TryPromoteWaitlistAsync_skips_when_at_capacity()
    {
        var bookId = Guid.NewGuid();
        _bookCatalog.GetBookAsync(bookId, Arg.Any<CancellationToken>())
            .Returns(new BookAvailabilitySnapshot(1, 0));

        SeedBooking(bookId: bookId, status: BookingStatus.Active, dueDaysFromNow: 3);
        _db.Waitlist.Add(new WaitlistEntry
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            BorrowerName = "Čakateľ",
            BorrowerEmail = "waiter@spst.sk",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        await _sut.TryPromoteWaitlistAsync(bookId);

        (await _db.Waitlist.CountAsync()).Should().Be(1);
        (await _db.Bookings.CountAsync(b => b.BorrowerEmail == "waiter@spst.sk")).Should().Be(0);
        _events.Events.Should().BeEmpty();
    }

    private Booking SeedBooking(
        Guid? bookId = null,
        BookingStatus status = BookingStatus.Reserved,
        int dueDaysFromNow = 7)
    {
        var now = DateTimeOffset.UtcNow;
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookId = bookId ?? Guid.NewGuid(),
            BorrowerName = "Reader",
            BorrowerEmail = $"{Guid.NewGuid():N}@spst.sk",
            Status = status,
            ReservedAt = now,
            BorrowedAt = status is BookingStatus.Active or BookingStatus.Overdue ? now : null,
            DueDate = now.AddDays(dueDaysFromNow),
            CreatedAt = now,
            UpdatedAt = now,
        };
        _db.Bookings.Add(booking);
        return booking;
    }

    private static LoanLifecycleService CreateSut(
        BookingDbContext db,
        IBookCatalogLookup bookCatalog,
        RecordingEventPublisher events,
        LoanPolicyOptions? policy = null)
    {
        var repo = new BookingRepository(db);
        var uow = new UnitOfWork(db, repo);
        var policyOpts = policy ?? new LoanPolicyOptions
        {
            DefaultLoanDays = 14,
            ReminderDaysBeforeDue = 3,
            SkipNonSchoolDays = false,
            HolidayCountryCode = "SK",
        };

        var http = new HttpClient(new EmptyJsonHandler());
        var nager = new NagerDateClient(
            http,
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<NagerDateClient>.Instance);
        var loanPolicy = new FixedLoanPolicyProvider(policyOpts);
        var calendar = new SchoolCalendarService(nager, loanPolicy);
        var waitlist = new WaitlistService(db, NullLogger<WaitlistService>.Instance);

        return new LoanLifecycleService(
            uow,
            new NullAppCache(),
            events,
            loanPolicy,
            waitlist,
            bookCatalog,
            calendar,
            NullLogger<LoanLifecycleService>.Instance);
    }

    private sealed class EmptyJsonHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent("[]", System.Text.Encoding.UTF8, "application/json"),
            });
    }
}