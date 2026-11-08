using CategoryService.DTOs;
using FluentValidation;

namespace CategoryService.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator() => CategoryRequestRules.Apply(this);
}
