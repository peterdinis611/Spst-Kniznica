using BookService.Data;
using BookService.Models;
using BookService.Services;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;

namespace BookService.Tests.Services;

public class BookingCopyDenormalizationServiceTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private BookDbContext _db = null!;
    private IAppCache _cache = null!;
    private BookingCopyDenormalizationService _sut = null!;
    private Guid _bookId;
    private Guid _copyId;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<BookDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new BookDbContext(options);
        await _db.Database.EnsureCreatedAsync();
        _cache = Substitute.For<IAppCache>();
        _sut = new BookingCopyDenormalizationService(
            _db,
            _cache,
            NullLogger<BookingCopyDenormalizationService>.Instance);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task ApplyStatusAsync_ignores_unknown_booking_status()
    {
        await SeedAsync(BookCopyStatus.Available);

        await _sut.ApplyStatusAsync(_bookId, _copyId, "weird", CancellationToken.None);

        var copy = await _db.BookCopies.AsNoTracking().SingleAsync();
        copy.Status.Should().Be(BookCopyStatus.Available);
        copy.Version.Should().Be(0);
        await _cache.DidNotReceive().RemoveByPrefixAsync(
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApplyStatusAsync_does_not_overwrite_lost_or_maintenance()
    {
        await SeedAsync(BookCopyStatus.Lost);

        await _sut.ApplyStatusAsync(_bookId, _copyId, "returned", CancellationToken.None);
        await _sut.ApplyStatusAsync(_bookId, _copyId, "active", CancellationToken.None);

        var copy = await _db.BookCopies.AsNoTracking().SingleAsync();
        copy.Status.Should().Be(BookCopyStatus.Lost);
        copy.Version.Should().Be(0);
        await _cache.DidNotReceive().RemoveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApplyStatusAsync_return_releases_borrowed_copy_and_list_cache()
    {
        await SeedAsync(BookCopyStatus.Borrowed);

        await _sut.ApplyStatusAsync(_bookId, _copyId, "returned", CancellationToken.None);

        _db.ChangeTracker.Clear();
        var book = await _db.Books.Include(b => b.Copies).SingleAsync();
        book.Copies.Single().Status.Should().Be(BookCopyStatus.Available);
        book.Copies.Single().Version.Should().Be(1);
        book.AvailableCopies.Should().Be(1);
        await _cache.Received(1).RemoveAsync(CacheKeys.Book(_bookId), Arg.Any<CancellationToken>());
        await _cache.Received(1).RemoveByPrefixAsync(
            CacheKeys.BookListPrefix,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApplyStatusAsync_active_loan_marks_available_copy_borrowed()
    {
        await SeedAsync(BookCopyStatus.Available);

        await _sut.ApplyStatusAsync(_bookId, _copyId, "overdue", CancellationToken.None);

        var copy = await _db.BookCopies.AsNoTracking().SingleAsync();
        copy.Status.Should().Be(BookCopyStatus.Borrowed);
        copy.Version.Should().Be(1);
    }

    private async Task SeedAsync(BookCopyStatus status)
    {
        _db.ChangeTracker.Clear();
        _db.Books.RemoveRange(_db.Books);
        await _db.SaveChangesAsync();

        var now = DateTimeOffset.UtcNow;
        _bookId = Guid.NewGuid();
        _copyId = Guid.NewGuid();
        var book = new Book
        {
            Id = _bookId,
            Title = "Výpožička",
            Author = "Autor",
            CreatedAt = now,
            UpdatedAt = now,
            Copies =
            [
                new BookCopy
                {
                    Id = _copyId,
                    BookId = _bookId,
                    InventoryNumber = $"INV-{_copyId:N}"[..12],
                    Status = status,
                    CreatedAt = now,
                    UpdatedAt = now,
                },
            ],
        };
        book.RecalculateCopyCounts();
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();
        _cache.ClearReceivedCalls();
    }
}
