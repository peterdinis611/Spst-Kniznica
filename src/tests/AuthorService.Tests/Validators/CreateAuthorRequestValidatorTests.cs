using AuthorService.DTOs;
using AuthorService.Validators;
using FluentAssertions;

namespace AuthorService.Tests.Validators;

public class CreateAuthorRequestValidatorTests
{
    private readonly CreateAuthorRequestValidator _validator = new();

    [Fact]
    public async Task Accepts_valid_author()
    {
        var result = await _validator.ValidateAsync(new CreateAuthorRequest
        {
            Name = "Ján Kováč",
            BirthYear = 1975,
            Nationality = "SK"
        });

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Rejects_empty_name_and_future_birth_year()
    {
        var result = await _validator.ValidateAsync(new CreateAuthorRequest
        {
            Name = "",
            BirthYear = DateTime.UtcNow.Year + 5
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
        result.Errors.Should().Contain(e => e.PropertyName == "BirthYear");
    }
}
