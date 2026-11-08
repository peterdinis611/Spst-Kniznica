using BookService.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BookService.Filters;

public class RepositoryValidationExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not RepositoryValidationException exception)
        {
            return;
        }

        var problem = new ValidationProblemDetails(
            exception.Errors.ToDictionary(pair => pair.Key, pair => pair.Value))
        {
            Title = "Repository validation failed",
            Status = StatusCodes.Status400BadRequest,
            Instance = context.HttpContext.Request.Path
        };

        context.Result = new BadRequestObjectResult(problem);
        context.ExceptionHandled = true;
    }
}
