using BookService.DTOs;
using BookService.Interfaces;
using BookService.Validators;
using FluentAssertions;
using NSubstitute;

namespace BookService.Tests.Validators;

public class BookValidationRulesTests
{
    [Theory]
    [InlineData("978-0-13-110362-7", "9780131103627")]
    [InlineData("0 306 40615 2", "0306406152")]
    [InlineData("  ", null)]
    [InlineData(null, null)]
    public void NormalizeIsbn_strips_separators(string? input, string? expected)
    {
        BookValidationRules.NormalizeIsbn(input).Should().Be(expected);
    }

    [Fact]
    public async Task CreateBookRequestValidator_accepts_valid_book()
    {
        var books = Substitute.For<IBookRepository>();
        books.IsbnExistsAsync(Arg.Any<string>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(false);

        var validator = new CreateBookRequestValidator(books);
        var result = await validator.ValidateAsync(new CreateBookRequest
        {
            Title = "Elektrotechnika I",
            AuthorId = Guid.NewGuid(),
            Isbn = "978-0-13-110362-7",
            PublishedYear = 2020,
            TotalCopies = 3,
            AvailableCopies = 2
        });

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task CreateBookRequestValidator_rejects_bad_isbn_and_copy_bounds()
    {
        var books = Substitute.For<IBookRepository>();
        var validator = new CreateBookRequestValidator(books);

        var result = await validator.ValidateAsync(new CreateBookRequest
        {
            Title = "X",
            AuthorId = Guid.NewGuid(),
            Isbn = "123",
            TotalCopies = 1,
            AvailableCopies = 5
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Isbn");
        result.Errors.Should().Contain(e => e.PropertyName == "AvailableCopies");
    }

    [Fact]
    public async Task CreateBookRequestValidator_rejects_duplicate_isbn()
    {
        var books = Substitute.For<IBookRepository>();
        books.IsbnExistsAsync("9780131103627", Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var validator = new CreateBookRequestValidator(books);
        var result = await validator.ValidateAsync(new CreateBookRequest
        {
            Title = "Elektrotechnika I",
            AuthorId = Guid.NewGuid(),
            Isbn = "978-0-13-110362-7"
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == "Isbn" &&
            e.ErrorMessage.Contains("already exists", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ToBook_maps_cover_url_and_normalizes_isbn()
    {
        var book = new CreateBookRequest
        {
            Title = "Test",
            AuthorId = Guid.NewGuid(),
            Isbn = "978-0-13-110362-7",
            CoverUrl = " https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg ",
            TotalCopies = 1,
            AvailableCopies = 1,
        }.ToBook();

        book.Isbn.Should().Be("9780131103627");
        book.CoverUrl.Should().Be("https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg");
    }
}
