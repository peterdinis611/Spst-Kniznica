using BookService.DTOs;
using BookService.Interfaces;
using FluentValidation;

namespace BookService.Validators;

public class UpdateBookRequestValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookRequestValidator(IBookRepository books)
    {
        BookValidationRules.ApplyCommonRules(this);

        RuleFor(x => x.Isbn)
            .MustAsync(async (request, isbn, context, cancellationToken) =>
            {
                var normalized = BookValidationRules.NormalizeIsbn(isbn);
                if (normalized is null)
                {
                    return true;
                }

                var excludeId = context.RootContextData.TryGetValue("BookId", out var value) && value is Guid id
                    ? id
                    : (Guid?)null;

                return !await books.IsbnExistsAsync(normalized, excludeId, cancellationToken);
            })
            .When(x => !string.IsNullOrWhiteSpace(x.Isbn))
            .WithMessage("A book with this ISBN already exists.");
    }
}
