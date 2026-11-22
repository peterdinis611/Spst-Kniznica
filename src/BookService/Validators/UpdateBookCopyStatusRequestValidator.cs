using BookService.DTOs;
using BookService.Models;
using FluentValidation;

namespace BookService.Validators;

public class UpdateBookCopyStatusRequestValidator : AbstractValidator<UpdateBookCopyStatusRequest>
{
    public UpdateBookCopyStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("Stav výtlačku je povinný.")
            .Must(status => status is BookCopyStatus.Available or BookCopyStatus.Lost or BookCopyStatus.Maintenance)
            .WithMessage("Stavy požičaný a rezervovaný sa menia len cez výpožičky.");
    }
}
