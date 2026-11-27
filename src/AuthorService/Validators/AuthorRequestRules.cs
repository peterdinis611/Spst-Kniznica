using AuthorService.DTOs;
using FluentValidation;
using SpstKniznica.Common.Text;

namespace AuthorService.Validators;

public static class AuthorRequestRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : IAuthorRequest
    {
        validator.RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200)
            .Must(HtmlSafety.IsPlainText).WithMessage("Name must be plain text (no HTML).");

        validator.RuleFor(x => x.Biography)
            .MaximumLength(4000)
            .Must(HtmlSafety.IsPlainText).WithMessage("Biography must be plain text (no HTML).");

        validator.RuleFor(x => x.Nationality)
            .MaximumLength(100)
            .Must(HtmlSafety.IsPlainText).WithMessage("Nationality must be plain text (no HTML).");

        var maxYear = DateTime.UtcNow.Year;
        validator.RuleFor(x => x.BirthYear)
            .Must(year => year is null || (year >= 1 && year <= maxYear))
            .WithMessage($"Birth year must be between 1 and {maxYear}.");
    }
}
