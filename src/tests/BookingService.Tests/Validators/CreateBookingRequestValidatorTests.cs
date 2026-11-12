using BookingService.DTOs;
using BookingService.Models;
using BookingService.Validators;
using FluentAssertions;

namespace BookingService.Tests.Validators;

public class CreateBookingRequestValidatorTests
{
    private readonly CreateBookingRequestValidator _validator = new();

    [Fact]
    public async Task Accepts_valid_reservation()
    {
        var result = await _validator.ValidateAsync(ValidRequest());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Rejects_missing_borrower_and_invalid_email()
    {
        var request = ValidRequest();
        request.BorrowerName = "";
        request.BorrowerEmail = "not-an-email";

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BorrowerName");
        result.Errors.Should().Contain(e => e.PropertyName == "BorrowerEmail");
    }

    [Fact]
    public async Task Rejects_empty_book_copy_guid()
    {
        var request = ValidRequest();
        request.BookCopyId = Guid.Empty;

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BookCopyId");
    }

    private static CreateBookingRequest ValidRequest() => new()
    {
        BookId = Guid.NewGuid(),
        BorrowerName = "Eva Nováková",
        BorrowerEmail = "eva@spst.sk",
        Status = BookingStatus.Reserved,
        DueDate = DateTimeOffset.UtcNow.AddDays(14)
    };
}
