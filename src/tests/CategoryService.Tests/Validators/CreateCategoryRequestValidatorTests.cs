using CategoryService.DTOs;
using CategoryService.Validators;
using FluentAssertions;

namespace CategoryService.Tests.Validators;

public class CreateCategoryRequestValidatorTests
{
    private readonly CreateCategoryRequestValidator _validator = new();

    [Theory]
    [InlineData("#abc")]
    [InlineData("#AABBCC")]
    [InlineData(null)]
    [InlineData("")]
    public async Task Accepts_valid_or_blank_color(string? color)
    {
        var result = await _validator.ValidateAsync(new CreateCategoryRequest
        {
            Name = "Elektrotechnika",
            Color = color
        });

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("red")]
    [InlineData("#GGHHII")]
    [InlineData("#12")]
    public async Task Rejects_invalid_hex_color(string color)
    {
        var result = await _validator.ValidateAsync(new CreateCategoryRequest
        {
            Name = "Elektrotechnika",
            Color = color
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Color");
    }

    [Fact]
    public async Task Rejects_empty_name()
    {
        var result = await _validator.ValidateAsync(new CreateCategoryRequest { Name = "" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }
}
