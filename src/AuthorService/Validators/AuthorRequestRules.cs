using AuthorService.DTOs;
using FluentValidation;

namespace AuthorService.Validators;

public static class AuthorRequestRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : IAuthorRequest
    {
        validator.RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200);

        validator.RuleFor(x => x.Biography)
            .MaximumLength(4000);

        validator.RuleFor(x => x.Nationality)
            .MaximumLength(100);

        var maxYear = DateTime.UtcNow.Year;
        validator.RuleFor(x => x.BirthYear)
            .Must(year => year is null || (year >= 1 && year <= maxYear))
            .WithMessage($"Birth year must be between 1 and {maxYear}.");
    }
}
