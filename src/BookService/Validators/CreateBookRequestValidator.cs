using BookService.DTOs;
using BookService.Repositories;
using FluentValidation;

namespace BookService.Validators;

public class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    public CreateBookRequestValidator(IBookRepository books)
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(300);

        RuleFor(x => x.Author)
            .NotEmpty().WithMessage("Author is required.")
            .MaximumLength(200);

        RuleFor(x => x.Isbn)
            .ApplyIsbnFormat()
            .MustAsync(async (isbn, cancellationToken) =>
            {
                var normalized = BookValidationRules.NormalizeIsbn(isbn);
                return normalized is null ||
                       !await books.IsbnExistsAsync(normalized, cancellationToken: cancellationToken);
            })
            .WithMessage("A book with this ISBN already exists.");

        RuleFor(x => x.PublishedYear).ApplyPublishedYear();
    }
}
