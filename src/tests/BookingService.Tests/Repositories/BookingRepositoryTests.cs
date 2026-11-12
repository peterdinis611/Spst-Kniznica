using BookingService.Data;
using BookingService.DTOs;
using BookingService.Models;
using BookingService.Repositories;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Tests.Repositories;

public class BookingRepositoryTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private BookingDbContext _db = null!;
    private BookingRepository _sut = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new BookingDbContext(options);
        await _db.Database.EnsureCreatedAsync();
        _sut = new BookingRepository(_db);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task HasActiveBookingForCopyAsync_detects_reserved_active_and_overdue()
    {
        var copyId = Guid.NewGuid();
        await SeedAsync(
            Booking(copyId, BookingStatus.Returned),
            Booking(copyId, BookingStatus.Cancelled),
            Booking(Guid.NewGuid(), BookingStatus.Active));

        (await _sut.HasActiveBookingForCopyAsync(copyId)).Should().BeFalse();

        var activeId = Guid.NewGuid();
        await SeedAsync(Booking(copyId, BookingStatus.Active, activeId));
        (await _sut.HasActiveBookingForCopyAsync(copyId)).Should().BeTrue();
        (await _sut.HasActiveBookingForCopyAsync(copyId, activeId)).Should().BeFalse();
    }

    [Fact]
    public async Task FindAsync_filters_by_email_and_sorts_by_due_date()
    {
        var earlier = DateTimeOffset.Parse("2026-11-01T15:00:00Z");
        var later = DateTimeOffset.Parse("2026-11-20T15:00:00Z");

        await SeedAsync(
            Booking(email: "eva@spst.sk", due: later, name: "Eva"),
            Booking(email: "eva@spst.sk", due: earlier, name: "Eva"),
            Booking(email: "peter@spst.sk", due: earlier, name: "Peter"));

        var result = await _sut.FindAsync(new BookingQueryFilter
        {
            BorrowerEmail = "EVA@spst.sk",
            Page = 1,
            PageSize = 10,
            SortBy = "dueDate",
            SortDir = "asc"
        });

        result.TotalCount.Should().Be(2);
        result.Items.Select(b => b.DueDate).Should().Equal(earlier, later);
    }

    [Fact]
    public async Task FindAsync_pages_sorted_results()
    {
        await SeedAsync(
            Booking(due: DateTimeOffset.Parse("2026-11-01T00:00:00Z")),
            Booking(due: DateTimeOffset.Parse("2026-11-02T00:00:00Z")),
            Booking(due: DateTimeOffset.Parse("2026-11-03T00:00:00Z")));

        var page = await _sut.FindAsync(new BookingQueryFilter
        {
            Page = 2,
            PageSize = 1,
            SortBy = "dueDate",
            SortDir = "asc"
        });

        page.TotalCount.Should().Be(3);
        page.Items.Should().HaveCount(1);
        page.Items[0].DueDate.Should().Be(DateTimeOffset.Parse("2026-11-02T00:00:00Z"));
    }

    private async Task SeedAsync(params Booking[] bookings)
    {
        _db.Bookings.AddRange(bookings);
        await _db.SaveChangesAsync();
    }

    private static Booking Booking(
        Guid? copyId = null,
        BookingStatus status = BookingStatus.Reserved,
        Guid? id = null,
        string email = "reader@spst.sk",
        DateTimeOffset? due = null,
        string name = "Reader")
    {
        var now = DateTimeOffset.UtcNow;
        return new Booking
        {
            Id = id ?? Guid.NewGuid(),
            BookId = Guid.NewGuid(),
            BookCopyId = copyId,
            BorrowerName = name,
            BorrowerEmail = email,
            Status = status,
            ReservedAt = now,
            DueDate = due ?? now.AddDays(7),
            CreatedAt = now,
            UpdatedAt = now
        };
    }
}
