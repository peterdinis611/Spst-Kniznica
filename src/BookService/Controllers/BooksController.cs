using BookService.DTOs;
using BookService.Interfaces;
using BookService.Models;
using BookService.Validators;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace BookService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(
    IBookRepository books,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Book>>> Get(
        [FromQuery] BookQueryFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await books.FindAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Book>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var book = await books.GetByIdAsync(id, cancellationToken);
        return book is null ? NotFound() : Ok(book);
    }

    [HttpPost]
    public async Task<ActionResult<Book>> Create(
        [FromBody] CreateBookRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var created = await books.AddAsync(request.ToBook(), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Book>> Update(
        Guid id,
        [FromBody] UpdateBookRequest request,
        CancellationToken cancellationToken)
    {
        var context = new ValidationContext<UpdateBookRequest>(request);
        context.RootContextData["BookId"] = id;

        var validation = await updateValidator.ValidateAsync(context, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var book = await books.UpdateAsync(id, request.ToBook(id), cancellationToken);
        return book is null ? NotFound() : Ok(book);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await books.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
