using AuthorService.DTOs;
using FluentValidation;

namespace AuthorService.Validators;

public class UpdateAuthorRequestValidator : AbstractValidator<UpdateAuthorRequest>
{
    public UpdateAuthorRequestValidator() => AuthorRequestRules.Apply(this);
}
