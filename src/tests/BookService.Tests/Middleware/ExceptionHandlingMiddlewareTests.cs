using System.Net;
using System.Text.Json;
using BookService.Exceptions;
using BookService.Middleware;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace BookService.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_maps_app_validation_to_400_problem_json()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var sut = new ExceptionHandlingMiddleware(
            _ => throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Title"] = ["Title is required."],
            }),
            NullLogger<ExceptionHandlingMiddleware>.Instance);

        await sut.InvokeAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        var payload = await ReadJson(context);
        payload.GetProperty("title").GetString().Should().Be("Validation failed");
        payload.GetProperty("detail").GetString().Should().Contain("validation");
        payload.GetProperty("errors").GetProperty("Title")[0].GetString()
            .Should().Be("Title is required.");
    }

    [Fact]
    public async Task InvokeAsync_maps_fluent_validation_to_400()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var failures = new List<ValidationFailure>
        {
            new("Isbn", "ISBN is invalid."),
        };
        var sut = new ExceptionHandlingMiddleware(
            _ => throw new ValidationException(failures),
            NullLogger<ExceptionHandlingMiddleware>.Instance);

        await sut.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400);
        var payload = await ReadJson(context);
        payload.GetProperty("errors").GetProperty("Isbn")[0].GetString()
            .Should().Be("ISBN is invalid.");
    }

    [Fact]
    public async Task InvokeAsync_maps_not_found_to_404()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var sut = new ExceptionHandlingMiddleware(
            _ => throw new NotFoundException("Book missing"),
            NullLogger<ExceptionHandlingMiddleware>.Instance);

        await sut.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404);
        var payload = await ReadJson(context);
        payload.GetProperty("detail").GetString().Should().Be("Book missing");
    }

    [Fact]
    public async Task InvokeAsync_masks_exception_message_on_500()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var sut = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("secret connection string leaked"),
            NullLogger<ExceptionHandlingMiddleware>.Instance);

        await sut.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(500);
        var payload = await ReadJson(context);
        var json = payload.ToString();
        json.Should().NotContain("secret connection string");
        payload.GetProperty("detail").GetString()
            .Should().Be("An unexpected error occurred. Please try again later.");
        payload.GetProperty("errors").GetProperty("error")[0].GetString()
            .Should().Be("Please try again later.");
    }

    private static async Task<JsonElement> ReadJson(HttpContext context)
    {
        context.Response.Body.Position = 0;
        using var doc = await JsonDocument.ParseAsync(context.Response.Body);
        return doc.RootElement.Clone();
    }
}
