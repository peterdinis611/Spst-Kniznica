using System.Net;
using System.Text.Json;
using CategoryService.Exceptions;
using FluentValidation;

namespace CategoryService.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await WriteProblemAsync(context, exception);
        }
    }

    private async Task WriteProblemAsync(HttpContext context, Exception exception)
    {
        var (status, title, errors) = exception switch
        {
            AppValidationException appValidation => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                appValidation.Errors),
            ValidationException fluentValidation => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                fluentValidation.Errors
                    .GroupBy(e => string.IsNullOrWhiteSpace(e.PropertyName) ? "error" : e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray(), StringComparer.OrdinalIgnoreCase)),
            NotFoundException => (
                HttpStatusCode.NotFound,
                "Resource not found",
                new Dictionary<string, string[]> { ["error"] = [exception.Message] }),
            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred",
                new Dictionary<string, string[]> { ["error"] = ["Please try again later."] })
        };

        if (status == HttpStatusCode.InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Handled exception ({Status}) for {Method} {Path}", (int)status, context.Request.Method, context.Request.Path);
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)status;

        var payload = new
        {
            type = $"https://httpstatuses.com/{(int)status}",
            title,
            status = (int)status,
            detail = exception.Message,
            instance = context.Request.Path.Value,
            errors,
            traceId = context.TraceIdentifier
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
