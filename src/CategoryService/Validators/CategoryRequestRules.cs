using CategoryService.DTOs;
using FluentValidation;

namespace CategoryService.Validators;

public static class CategoryRequestRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : ICategoryRequest
    {
        validator.RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100);

        validator.RuleFor(x => x.Description)
            .MaximumLength(1000);

        validator.RuleFor(x => x.Color)
            .MaximumLength(32)
            .Matches("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
            .When(x => !string.IsNullOrWhiteSpace(x.Color))
            .WithMessage("Color must be a hex value like #RGB or #RRGGBB.");
    }
}
