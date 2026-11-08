using CategoryService.DTOs;
using FluentValidation;

namespace CategoryService.Validators;

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator() => CategoryRequestRules.Apply(this);
}
