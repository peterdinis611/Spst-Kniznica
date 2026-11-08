using BookService.DTOs;
using BookService.Interfaces;
using BookService.Models;
using Microsoft.AspNetCore.Mvc;

namespace BookService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BooksController(IBooksService books) : ControllerBase
{
    /// <summary>
    /// Search books with filtering, sorting and pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Book>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<Book>>> Get(
        [FromQuery] BookQueryFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await books.SearchAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get a book including all physical copies (barcode / inventory number).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BookDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var book = await books.GetByIdAsync(id, cancellationToken);
        return Ok(book);
    }

    /// <summary>
    /// Create a book and generate inventory copies.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BookDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookDetailDto>> Create(
        [FromBody] CreateBookRequest request,
        CancellationToken cancellationToken)
    {
        var created = await books.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Update a book and adjust copy count when needed.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(BookDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookDetailDto>> Update(
        Guid id,
        [FromBody] UpdateBookRequest request,
        CancellationToken cancellationToken)
    {
        var book = await books.UpdateAsync(id, request, cancellationToken);
        return Ok(book);
    }

    /// <summary>
    /// Delete a book when no copies are borrowed/reserved.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await books.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Bulk import books from CSV or Excel (.xlsx).
    /// </summary>
    [HttpPost("import")]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkImportResult>> Import(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["file"] = ["A non-empty .csv or .xlsx file is required."]
            }));
        }

        await using var stream = file.OpenReadStream();
        var result = await books.ImportAsync(stream, file.FileName, cancellationToken);
        return Ok(result);
    }
}
