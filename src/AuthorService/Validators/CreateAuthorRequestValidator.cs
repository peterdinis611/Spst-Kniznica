using AuthorService.DTOs;
using FluentValidation;

namespace AuthorService.Validators;

public class CreateAuthorRequestValidator : AbstractValidator<CreateAuthorRequest>
{
    public CreateAuthorRequestValidator() => AuthorRequestRules.Apply(this);
}
