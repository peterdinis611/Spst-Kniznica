using BookService.DTOs;
using BookService.Interfaces;
using FluentValidation;

namespace BookService.Validators;

public class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    public CreateBookRequestValidator(IBookRepository books)
    {
        BookValidationRules.ApplyCommonRules(this);

        RuleFor(x => x.Isbn)
            .MustAsync(async (isbn, cancellationToken) =>
            {
                var normalized = BookValidationRules.NormalizeIsbn(isbn);
                return normalized is null ||
                       !await books.IsbnExistsAsync(normalized, cancellationToken: cancellationToken);
            })
            .When(x => !string.IsNullOrWhiteSpace(x.Isbn))
            .WithMessage("A book with this ISBN already exists.");
    }
}
