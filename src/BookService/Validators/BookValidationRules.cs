using BookService.Interfaces;
using BookService.Models;
using FluentValidation;

namespace BookService.Validators;

public static class BookValidationRules
{
    public static string? NormalizeIsbn(string? isbn)
    {
        if (string.IsNullOrWhiteSpace(isbn))
        {
            return null;
        }

        return new string(isbn.Where(c => c is not ('-' or ' ')).ToArray());
    }

    public static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public static void ApplyCommonRules<T>(AbstractValidator<T> validator) where T : IBookRequest
    {
        validator.RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(300);

        validator.RuleFor(x => x.Subtitle)
            .MaximumLength(300);

        validator.RuleFor(x => x.AuthorId)
            .NotEmpty().WithMessage("AuthorId is required.");

        validator.RuleFor(x => x.Publisher)
            .MaximumLength(200);

        validator.RuleFor(x => x.Language)
            .MaximumLength(50);

        validator.RuleFor(x => x.CategoryId)
            .Must(id => id is null || id != Guid.Empty)
            .WithMessage("CategoryId must be a valid non-empty GUID.");

        validator.RuleFor(x => x.Description)
            .MaximumLength(4000);

        validator.RuleFor(x => x.ShelfLocation)
            .MaximumLength(50);

        validator.RuleFor(x => x.PageCount)
            .GreaterThan(0)
            .When(x => x.PageCount.HasValue)
            .WithMessage("Page count must be greater than 0.");

        validator.RuleFor(x => x.Format)
            .IsInEnum()
            .WithMessage("Format must be a valid book format.");

        validator.RuleFor(x => x.TotalCopies)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Total copies must be at least 1.");

        validator.RuleFor(x => x.AvailableCopies)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Available copies cannot be negative.")
            .LessThanOrEqualTo(x => x.TotalCopies)
            .WithMessage("Available copies cannot exceed total copies.");

        validator.RuleFor(x => x.Isbn).ApplyIsbnFormat();
        validator.RuleFor(x => x.PublishedYear).ApplyPublishedYear();
    }

    public static IRuleBuilderOptions<T, string?> ApplyIsbnFormat<T>(this IRuleBuilder<T, string?> rule)
    {
        return rule
            .MaximumLength(32)
            .Must(isbn =>
            {
                var normalized = NormalizeIsbn(isbn);
                return normalized is null || IsValidIsbn(normalized);
            })
            .WithMessage("ISBN must be a valid ISBN-10 or ISBN-13.");
    }

    public static IRuleBuilderOptions<T, int?> ApplyPublishedYear<T>(this IRuleBuilderInitial<T, int?> rule)
    {
        var maxYear = DateTime.UtcNow.Year + 1;
        return rule
            .Must(year => year is null || (year >= 1450 && year <= maxYear))
            .WithMessage($"Published year must be between 1450 and {maxYear}.");
    }

    public static Book ToBook(this IBookRequest request, Guid? id = null, DateTimeOffset? createdAt = null)
    {
        var now = DateTimeOffset.UtcNow;
        return new Book
        {
            Id = id ?? Guid.NewGuid(),
            Title = request.Title.Trim(),
            Subtitle = NormalizeOptional(request.Subtitle),
            AuthorId = request.AuthorId,
            Author = string.Empty,
            Publisher = NormalizeOptional(request.Publisher),
            Isbn = NormalizeIsbn(request.Isbn),
            PublishedYear = request.PublishedYear,
            Language = NormalizeOptional(request.Language),
            CategoryId = request.CategoryId,
            CategoryName = null,
            Description = NormalizeOptional(request.Description),
            CoverUrl = NormalizeOptional(request.CoverUrl),
            PageCount = request.PageCount,
            Format = request.Format,
            ShelfLocation = NormalizeOptional(request.ShelfLocation),
            TotalCopies = request.TotalCopies,
            AvailableCopies = request.AvailableCopies,
            CreatedAt = createdAt ?? now,
            UpdatedAt = now
        };
    }

    private static bool IsValidIsbn(string value)
    {
        return System.Text.RegularExpressions.Regex.IsMatch(
            value,
            @"^(97[89]\d{10}|\d{9}[\dXx])$");
    }
}
