using BookingService.DTOs;
using FluentValidation;

namespace BookingService.Validators;

public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator() => BookingRequestRules.Apply(this);
}
