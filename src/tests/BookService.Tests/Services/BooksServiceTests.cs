using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using BookService.Services;
using BookService.Validators;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace BookService.Tests.Services;

public class BooksServiceTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IBookRepository _books = Substitute.For<IBookRepository>();
    private readonly IAuthorLookup _authors = Substitute.For<IAuthorLookup>();
    private readonly ICategoryLookup _categories = Substitute.For<ICategoryLookup>();
    private readonly RecordingEventPublisher _events = new();
    private readonly BooksService _sut;

    public BooksServiceTests()
    {
        _unitOfWork.Books.Returns(_books);
        _sut = new BooksService(
            _unitOfWork,
            _authors,
            _categories,
            new NullAppCache(),
            _events,
            new CreateBookRequestValidator(_books),
            new UpdateBookRequestValidator(_books),
            new UpdateBookCopyStatusRequestValidator(),
            NullLogger<BooksService>.Instance);
    }

    [Fact]
    public async Task CreateAsync_persists_book_with_copies_and_publishes_event()
    {
        var authorId = Guid.NewGuid();
        Book? saved = null;

        _books.IsbnExistsAsync(Arg.Any<string>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(false);
        _authors.GetByIdAsync(authorId, Arg.Any<CancellationToken>())
            .Returns(new AuthorLookupResult(authorId, "Ján Kováč", IsActive: true));
        _books.AddAsync(Arg.Do<Book>(b => saved = b), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var dto = await _sut.CreateAsync(new CreateBookRequest
        {
            Title = "  Elektrotechnika I  ",
            AuthorId = authorId,
            Isbn = "978-0-13-110362-7",
            PublishedYear = 2020,
            TotalCopies = 2,
            AvailableCopies = 2,
            Language = "sk",
        });

        saved.Should().NotBeNull();
        saved!.Title.Should().Be("Elektrotechnika I");
        saved.Author.Should().Be("Ján Kováč");
        saved.Isbn.Should().Be("9780131103627");
        saved.Copies.Should().HaveCount(2);
        dto.Title.Should().Be("Elektrotechnika I");
        dto.TotalCopies.Should().Be(2);
        _events.Events.Should().ContainSingle(e => e is BookCreatedEvent);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_rejects_unknown_author()
    {
        var authorId = Guid.NewGuid();
        _books.IsbnExistsAsync(Arg.Any<string>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(false);
        _authors.GetByIdAsync(authorId, Arg.Any<CancellationToken>())
            .Returns((AuthorLookupResult?)null);

        var act = async () => await _sut.CreateAsync(new CreateBookRequest
        {
            Title = "Kniha",
            AuthorId = authorId,
            Isbn = "978-0-13-110362-7",
            TotalCopies = 1,
            AvailableCopies = 1,
        });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("AuthorId"));
    }

    [Fact]
    public async Task GetByIdAsync_throws_when_missing()
    {
        var id = Guid.NewGuid();
        _books.GetByIdAsync(id, true, Arg.Any<CancellationToken>()).Returns((Book?)null);

        var act = async () => await _sut.GetByIdAsync(id);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_blocks_when_copy_is_borrowed()
    {
        var id = Guid.NewGuid();
        var book = new Book
        {
            Id = id,
            Title = "Požičaná",
            AuthorId = Guid.NewGuid(),
            Author = "Autor",
            Isbn = "9780131103627",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Copies =
            [
                new BookCopy
                {
                    Id = Guid.NewGuid(),
                    BookId = id,
                    InventoryNumber = "A-1",
                    Status = BookCopyStatus.Borrowed,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow,
                },
            ],
        };
        _books.GetByIdAsync(id, true, Arg.Any<CancellationToken>()).Returns(book);

        var act = async () => await _sut.DeleteAsync(id);

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("Copies"));
        _events.Events.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_rejects_missing_status_before_loading_the_book()
    {
        var act = async () => await _sut.UpdateCopyStatusAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new UpdateBookCopyStatusRequest());

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("Status"));
        await _books.DidNotReceive().GetByIdAsync(
            Arg.Any<Guid>(),
            Arg.Any<bool>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_rejects_borrowed_target()
    {
        var act = async () => await _sut.UpdateCopyStatusAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Borrowed });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("Status"));
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_rejects_copy_that_is_out_on_loan()
    {
        var (book, copy) = BookWithCopy(BookCopyStatus.Reserved);
        _books.GetByIdAsync(book.Id, true, Arg.Any<CancellationToken>()).Returns(book);

        var act = async () => await _sut.UpdateCopyStatusAsync(
            book.Id,
            copy.Id,
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Lost });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("status"));
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        copy.Status.Should().Be(BookCopyStatus.Reserved);
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_marks_available_copy_lost_and_drops_list_cache()
    {
        var cache = Substitute.For<IAppCache>();
        var sut = new BooksService(
            _unitOfWork,
            _authors,
            _categories,
            cache,
            _events,
            new CreateBookRequestValidator(_books),
            new UpdateBookRequestValidator(_books),
            new UpdateBookCopyStatusRequestValidator(),
            NullLogger<BooksService>.Instance);
        var (book, copy) = BookWithCopy(BookCopyStatus.Available);
        book.Copies.Add(new BookCopy
        {
            Id = Guid.NewGuid(),
            BookId = book.Id,
            InventoryNumber = "A-2",
            Status = BookCopyStatus.Available,
            CreatedAt = book.CreatedAt,
            UpdatedAt = book.UpdatedAt,
        });
        book.RecalculateCopyCounts();
        _books.GetByIdAsync(book.Id, true, Arg.Any<CancellationToken>()).Returns(book);
        _unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var result = await sut.UpdateCopyStatusAsync(
            book.Id,
            copy.Id,
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Lost });

        copy.Status.Should().Be(BookCopyStatus.Lost);
        copy.Version.Should().Be(1);
        result.AvailableCopies.Should().Be(1);
        result.TotalCopies.Should().Be(2);
        _books.Received(1).Update(book);
        await cache.Received(1).RemoveByPrefixAsync(
            CacheKeys.BookListPrefix,
            Arg.Any<CancellationToken>());
        await cache.Received(1).SetAsync(
            CacheKeys.Book(book.Id),
            Arg.Any<BookDetailDto>(),
            Arg.Any<TimeSpan?>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateCopyStatusAsync_translates_concurrency_conflict()
    {
        var (book, copy) = BookWithCopy(BookCopyStatus.Available);
        _books.GetByIdAsync(book.Id, true, Arg.Any<CancellationToken>()).Returns(book);
        _unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromException<int>(new DbUpdateConcurrencyException()));

        var act = async () => await _sut.UpdateCopyStatusAsync(
            book.Id,
            copy.Id,
            new UpdateBookCopyStatusRequest { Status = BookCopyStatus.Maintenance });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("Conflict"));
    }

    private static (Book Book, BookCopy Copy) BookWithCopy(BookCopyStatus status)
    {
        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var copy = new BookCopy
        {
            Id = Guid.NewGuid(),
            BookId = id,
            InventoryNumber = "A-1",
            Status = status,
            CreatedAt = now,
            UpdatedAt = now,
        };
        var book = new Book
        {
            Id = id,
            Title = "Výtlačok",
            AuthorId = Guid.NewGuid(),
            Author = "Autor",
            Isbn = "9780131103627",
            CreatedAt = now,
            UpdatedAt = now,
            Copies = [copy],
        };
        book.RecalculateCopyCounts();
        return (book, copy);
    }

    private sealed class RecordingEventPublisher : IIntegrationEventPublisher
    {
        public List<object> Events { get; } = [];

        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
            where TEvent : IntegrationEvent
        {
            Events.Add(integrationEvent!);
            return Task.CompletedTask;
        }
    }
}
