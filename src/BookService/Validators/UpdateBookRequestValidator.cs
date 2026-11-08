using BookService.DTOs;
using BookService.Repositories;
using FluentValidation;

namespace BookService.Validators;

public class UpdateBookRequestValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookRequestValidator(IBookRepository books)
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(300);

        RuleFor(x => x.Author)
            .NotEmpty().WithMessage("Author is required.")
            .MaximumLength(200);

        RuleFor(x => x.Isbn)
            .ApplyIsbnFormat()
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
            .WithMessage("A book with this ISBN already exists.");

        RuleFor(x => x.PublishedYear).ApplyPublishedYear();
    }
}
