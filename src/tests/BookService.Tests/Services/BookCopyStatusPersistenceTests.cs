using BookService.Data;
using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using BookService.Repositories;
using BookService.Services;
using BookService.Validators;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace BookService.Tests.Services;

public class BookCopyStatusPersistenceTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private BookDbContext _db = null!;
    private BooksService _sut = null!;
    private IAppCache _cache = null!;
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

        var now = DateTimeOffset.UtcNow;
        _bookId = Guid.NewGuid();
        _copyId = Guid.NewGuid();
        var book = new Book
        {
            Id = _bookId,
            Title = "Výtlačok",
            Author = "Autor",
            CreatedAt = now,
            UpdatedAt = now,
            Copies =
            [
                new BookCopy
                {
                    Id = _copyId,
                    BookId = _bookId,
                    InventoryNumber = "INV-1",
                    Status = BookCopyStatus.Available,
                    CreatedAt = now,
                    UpdatedAt = now,
                },
                new BookCopy
                {
                    Id = Guid.NewGuid(),
                    BookId = _bookId,
                    InventoryNumber = "INV-2",
                    Status = BookCopyStatus.Available,
                    CreatedAt = now,
                    UpdatedAt = now,
                },
            ],
        };
        book.RecalculateCopyCounts();
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var books = new BookRepository(_db);
        _cache = Substitute.For<IAppCache>();
        _sut = new BooksService(
            new UnitOfWork(_db, books),
            Substitute.For<IAuthorLookup>(),
            Substitute.For<ICategoryLookup>(),
            _cache,
            new NullPublisher(),
            new CreateBookRequestValidator(books),
            new UpdateBookRequestValidator(books),
            new UpdateBookCopyStatusRequestValidator(),
            NullLogger<BooksService>.Instance);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_persists_lost_copy_and_invalidates_list_cache()
    {
        var result = await _sut.UpdateCopyStatusAsync(
            _bookId,
            _copyId,
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Lost });

        result.AvailableCopies.Should().Be(1);
        result.Copy.Status.Should().Be(BookCopyStatus.Lost);

        _db.ChangeTracker.Clear();
        var stored = await _db.BookCopies.AsNoTracking().SingleAsync(c => c.Id == _copyId);
        stored.Status.Should().Be(BookCopyStatus.Lost);
        stored.Version.Should().Be(1);
        await _cache.Received(1).RemoveByPrefixAsync(
            CacheKeys.BookListPrefix,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Second_writer_with_a_stale_snapshot_cannot_overwrite()
    {
        await using var other = new BookDbContext(
            new DbContextOptionsBuilder<BookDbContext>().UseSqlite(_connection).Options);
        var stale = await other.Books.AsNoTracking().Include(b => b.Copies).SingleAsync();

        await _sut.UpdateCopyStatusAsync(
            _bookId,
            _copyId,
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Lost });

        other.Books.Update(stale);
        var copy = stale.Copies.Single(c => c.Id == _copyId);
        copy.Status = BookCopyStatus.Maintenance;
        copy.Version++;

        var act = async () => await other.SaveChangesAsync();

        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();
        _db.ChangeTracker.Clear();
        var stored = await _db.BookCopies.AsNoTracking().SingleAsync(c => c.Id == _copyId);
        stored.Status.Should().Be(BookCopyStatus.Lost);
        stored.Version.Should().Be(1);
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_blocks_borrowed_copy()
    {
        var copy = await _db.BookCopies.SingleAsync(c => c.Id == _copyId);
        copy.Status = BookCopyStatus.Borrowed;
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var act = async () => await _sut.UpdateCopyStatusAsync(
            _bookId,
            _copyId,
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Available });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("status"));
    }

    private sealed class NullPublisher : IIntegrationEventPublisher
    {
        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
            where TEvent : IntegrationEvent
            => Task.CompletedTask;
    }
}
