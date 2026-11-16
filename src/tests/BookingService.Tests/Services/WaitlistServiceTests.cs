using BookingService.Data;
using BookingService.DTOs;
using BookingService.Models;
using BookingService.Services;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace BookingService.Tests.Services;

public class WaitlistServiceTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private BookingDbContext _db = null!;
    private WaitlistService _sut = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new BookingDbContext(options);
        await _db.Database.EnsureCreatedAsync();
        _sut = new WaitlistService(_db, NullLogger<WaitlistService>.Instance);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task JoinAsync_is_idempotent_per_borrower_and_book()
    {
        var bookId = Guid.NewGuid();
        var request = new JoinWaitlistRequest
        {
            BookId = bookId,
            BorrowerName = " Ema ",
            BorrowerEmail = " EMA@spst.sk ",
        };

        var first = await _sut.JoinAsync(request);
        var second = await _sut.JoinAsync(request);

        second.Id.Should().Be(first.Id);
        second.BorrowerEmail.Should().Be("ema@spst.sk");
        (await _db.Waitlist.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task DequeueNextAsync_returns_oldest_entry_and_removes_it()
    {
        var bookId = Guid.NewGuid();
        var older = new WaitlistEntry
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            BorrowerName = "First",
            BorrowerEmail = "first@spst.sk",
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        var newer = new WaitlistEntry
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            BorrowerName = "Second",
            BorrowerEmail = "second@spst.sk",
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
        };
        _db.Waitlist.AddRange(older, newer);
        await _db.SaveChangesAsync();

        var next = await _sut.DequeueNextAsync(bookId);

        next.Should().NotBeNull();
        next!.BorrowerEmail.Should().Be("first@spst.sk");
        (await _db.Waitlist.FindAsync(older.Id)).Should().BeNull();
        (await _db.Waitlist.FindAsync(newer.Id)).Should().NotBeNull();
    }
}