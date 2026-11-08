using BookingService.DTOs;
using FluentValidation;

namespace BookingService.Validators;

public class UpdateBookingRequestValidator : AbstractValidator<UpdateBookingRequest>
{
    public UpdateBookingRequestValidator() => BookingRequestRules.Apply(this);
}
