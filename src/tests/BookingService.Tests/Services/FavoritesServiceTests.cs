using BookingService.Data;
using BookingService.DTOs;
using BookingService.Exceptions;
using BookingService.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace BookingService.Tests.Services;

public class FavoritesServiceTests : IAsyncLifetime
{
    private BookingDbContext _db = null!;
    private FavoritesService _sut = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _db = new BookingDbContext(options);
        await _db.Database.OpenConnectionAsync();
        await _db.Database.EnsureCreatedAsync();
        _sut = new FavoritesService(_db, NullLogger<FavoritesService>.Instance);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
    }

    [Fact]
    public async Task AddAsync_normalizes_owner_email_and_defaults_list_name()
    {
        var bookId = Guid.NewGuid();

        var added = await _sut.AddAsync("  Reader@SPST.SK ", new AddFavoriteRequest
        {
            BookId = bookId,
        });

        added.BookId.Should().Be(bookId);
        added.ListName.Should().Be("Obľúbené");

        var listed = await _sut.ListAsync("reader@spst.sk");
        listed.Should().ContainSingle();
        listed[0].Id.Should().Be(added.Id);
    }

    [Fact]
    public async Task AddAsync_is_idempotent_for_same_book_and_list()
    {
        var bookId = Guid.NewGuid();
        var first = await _sut.AddAsync("a@spst.sk", new AddFavoriteRequest { BookId = bookId });
        var second = await _sut.AddAsync("a@spst.sk", new AddFavoriteRequest { BookId = bookId });

        second.Id.Should().Be(first.Id);
        (await _sut.ListAsync("a@spst.sk")).Should().ContainSingle();
    }

    [Fact]
    public async Task AddAsync_rejects_empty_book_id()
    {
        var act = async () => await _sut.AddAsync("a@spst.sk", new AddFavoriteRequest
        {
            BookId = Guid.Empty,
        });

        await act.Should().ThrowAsync<AppValidationException>();
    }

    [Fact]
    public async Task RemoveAsync_deletes_owned_favorite()
    {
        var added = await _sut.AddAsync("a@spst.sk", new AddFavoriteRequest
        {
            BookId = Guid.NewGuid(),
            ListName = "Sci-fi",
        });

        await _sut.RemoveAsync(added.Id, "a@spst.sk");

        (await _sut.ListAsync("a@spst.sk")).Should().BeEmpty();
    }

    [Fact]
    public async Task RemoveAsync_throws_when_missing()
    {
        var act = async () => await _sut.RemoveAsync(Guid.NewGuid(), "a@spst.sk");

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
