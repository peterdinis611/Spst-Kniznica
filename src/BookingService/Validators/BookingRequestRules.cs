using BookingService.DTOs;
using FluentValidation;

namespace BookingService.Validators;

public static class BookingRequestRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : IBookingRequest
    {
        validator.RuleFor(x => x.BookId)
            .NotEmpty().WithMessage("BookId is required.");

        validator.RuleFor(x => x.BookCopyId)
            .Must(id => id is null || id != Guid.Empty)
            .WithMessage("BookCopyId must be a non-empty GUID when provided.");

        validator.RuleFor(x => x.BorrowerName)
            .NotEmpty().WithMessage("BorrowerName is required.")
            .MaximumLength(200);

        validator.RuleFor(x => x.BorrowerEmail)
            .NotEmpty().WithMessage("BorrowerEmail is required.")
            .EmailAddress().WithMessage("BorrowerEmail must be a valid email address.")
            .MaximumLength(256);

        validator.RuleFor(x => x.Status)
            .IsInEnum();

        validator.RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("DueDate is required.");

        validator.RuleFor(x => x.Notes)
            .MaximumLength(1000);
    }
}
