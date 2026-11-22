using BookService.DTOs;
using BookService.Interfaces;
using BookService.Models;
using BookService.Services;
using BookService.Validators;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;
using SpstKniznica.Common.Pagination;

namespace BookService.Tests.Services;

public class CatalogReadCacheTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IBookRepository _books = Substitute.For<IBookRepository>();
    private readonly StoreCache _cache = new();
    private readonly BooksService _sut;

    public CatalogReadCacheTests()
    {
        _unitOfWork.Books.Returns(_books);
        _sut = new BooksService(
            _unitOfWork,
            Substitute.For<IAuthorLookup>(),
            Substitute.For<ICategoryLookup>(),
            _cache,
            Substitute.For<IIntegrationEventPublisher>(),
            new CreateBookRequestValidator(_books),
            new UpdateBookRequestValidator(_books),
            new UpdateBookCopyStatusRequestValidator(),
            NullLogger<BooksService>.Instance);
    }

    [Fact]
    public async Task SearchAsync_reuses_one_page_for_the_same_filter()
    {
        var authorA = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var authorB = Guid.Parse("22222222-2222-2222-2222-222222222222");
        _books.FindAsync(Arg.Any<BookQueryFilter>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<BookListItemDto>
            {
                Items = [],
                Page = 1,
                PageSize = 20,
                TotalCount = 0,
            });

        await _sut.SearchAsync(new BookQueryFilter
        {
            AuthorIds = [authorA, authorB],
            Search = " motor ",
            CategoryId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        });
        await _sut.SearchAsync(new BookQueryFilter
        {
            AuthorIds = [authorB, authorA],
            Search = "motor",
            CategoryId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        });

        await _books.Received(1).FindAsync(Arg.Any<BookQueryFilter>(), Arg.Any<CancellationToken>());
        _cache.Ttls.Should().ContainSingle().Which.Should().Be(TimeSpan.FromSeconds(20));
        _cache.Keys.Should().OnlyContain(key => key.StartsWith(CacheKeys.BookListPrefix + "p:"));
    }

    [Fact]
    public async Task SearchByCursorAsync_keeps_distinct_cursors()
    {
        _books.FindByCursorAsync(Arg.Any<BookCursorFilter>(), Arg.Any<CancellationToken>())
            .Returns(new CursorPage<BookListItemDto>
            {
                Items = [],
                HasMore = false,
                Limit = 40,
            });

        await _sut.SearchByCursorAsync(new BookCursorFilter { Limit = 40 });
        await _sut.SearchByCursorAsync(new BookCursorFilter { Limit = 40, Cursor = "abc" });
        await _sut.SearchByCursorAsync(new BookCursorFilter { Limit = 40 });

        await _books.Received(2).FindByCursorAsync(Arg.Any<BookCursorFilter>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetSummariesAsync_loads_only_ids_missing_from_cache()
    {
        var firstId = Guid.NewGuid();
        var secondId = Guid.NewGuid();
        var requested = new List<Guid[]>();
        _books.GetByIdsAsync(Arg.Any<IReadOnlyList<Guid>>(), Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                var ids = call.ArgAt<IReadOnlyList<Guid>>(0).ToArray();
                requested.Add(ids);
                IReadOnlyList<Book> books = ids.Select(id => new Book
                {
                    Id = id,
                    Title = "Elektrotechnika",
                    Author = "Kováč",
                    TotalCopies = 4,
                    AvailableCopies = 2,
                }).ToList();
                return books;
            });

        var first = await _sut.GetSummariesAsync([firstId]);
        var second = await _sut.GetSummariesAsync([firstId, secondId]);

        first.Should().ContainSingle(snapshot =>
            snapshot.BookId == firstId && snapshot.AvailableCopies == 2);
        second.Select(snapshot => snapshot.BookId).Should().Equal(firstId, secondId);
        requested.Should().HaveCount(2);
        requested[0].Should().Equal(firstId);
        requested[1].Should().Equal(secondId);
        _cache.Keys.Should().OnlyContain(key => key.StartsWith(CacheKeys.BookListPrefix + "s:"));
        _cache.Ttls.Should().OnlyContain(ttl => ttl == TimeSpan.FromSeconds(20));
    }

    private sealed class StoreCache : IAppCache
    {
        private readonly Dictionary<string, object> _items = new(StringComparer.Ordinal);

        public List<TimeSpan?> Ttls { get; } = [];

        public IReadOnlyCollection<string> Keys => _items.Keys;

        public bool IsEnabled => true;

        public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        {
            if (_items.TryGetValue(key, out var value) && value is T typed)
            {
                return Task.FromResult<T?>(typed);
            }

            return Task.FromResult<T?>(default);
        }

        public Task SetAsync<T>(
            string key,
            T value,
            TimeSpan? ttl = null,
            CancellationToken cancellationToken = default)
        {
            _items[key] = value!;
            Ttls.Add(ttl);
            return Task.CompletedTask;
        }

        public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            _items.Remove(key);
            return Task.CompletedTask;
        }

        public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
        {
            foreach (var key in _items.Keys.Where(item => item.StartsWith(prefix, StringComparison.Ordinal)).ToArray())
            {
                _items.Remove(key);
            }

            return Task.CompletedTask;
        }

        public async Task<T> GetOrSetAsync<T>(
            string key,
            Func<CancellationToken, Task<T>> factory,
            TimeSpan? ttl = null,
            CancellationToken cancellationToken = default)
        {
            var cached = await GetAsync<T>(key, cancellationToken);
            if (cached is not null)
            {
                return cached;
            }

            var value = await factory(cancellationToken);
            if (value is not null)
            {
                await SetAsync(key, value, ttl, cancellationToken);
            }

            return value;
        }

        public Task<IReadOnlyList<string>> ListKeysAsync(
            string? pattern = null,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<string>>(_items.Keys.ToList());
    }
}
