using CategoryService.DTOs;
using FluentValidation;

namespace CategoryService.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(1000);

        RuleFor(x => x.Color)
            .MaximumLength(32)
            .Matches("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
            .When(x => !string.IsNullOrWhiteSpace(x.Color))
            .WithMessage("Color must be a hex value like #RGB or #RRGGBB.");
    }
}
