using BookService.DTOs;
using BookService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Pagination;

namespace BookService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BooksController(IBooksService books, ILogger<BooksController> logger) : ControllerBase
{
    /// <summary>
    /// Search books with filtering, sorting and pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<BookListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<BookListItemDto>>> Get(
        [FromQuery] BookQueryFilter filter,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Searching books. Page={Page}, PageSize={PageSize}, SortBy={SortBy}, SortDir={SortDir}, Search={Search}",
            filter.Page,
            filter.PageSize,
            filter.SortBy,
            filter.SortDir,
            filter.Search);

        var result = await books.SearchAsync(filter, cancellationToken);

        logger.LogInformation(
            "Books search completed. Returned={Count}, Total={TotalCount}, Page={Page}",
            result.Items.Count,
            result.TotalCount,
            result.Page);

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
        logger.LogDebug("Getting book {BookId}", id);
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
        logger.LogInformation("Creating book '{Title}' by {Author}", request.Title, request.Author);
        var created = await books.CreateAsync(request, cancellationToken);
        logger.LogInformation("Book created successfully with id {BookId}", created.Id);
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
        logger.LogInformation("Updating book {BookId}", id);
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
        logger.LogWarning("Deleting book {BookId}", id);
        await books.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Bulk import books from CSV, XML or Excel (.xlsx) based on file extension.
    /// </summary>
    [HttpPost("import")]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkImportResult>> Import(IFormFile file, CancellationToken cancellationToken)
    {
        if (!IsValidUpload(file))
        {
            return InvalidFile(".csv, .xml or .xlsx");
        }

        logger.LogInformation("Starting bulk import. File={FileName}, Size={Size}", file.FileName, file.Length);
        await using var stream = file.OpenReadStream();
        var result = await books.ImportAsync(stream, file.FileName, cancellationToken);
        LogImportResult(file.FileName, result);
        return Ok(result);
    }

    /// <summary>
    /// Bulk import books from a CSV file.
    /// </summary>
    [HttpPost("import/csv")]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkImportResult>> ImportCsv(IFormFile file, CancellationToken cancellationToken)
    {
        if (!IsValidUpload(file))
        {
            return InvalidFile(".csv");
        }

        logger.LogInformation("Starting CSV import. File={FileName}, Size={Size}", file.FileName, file.Length);
        await using var stream = file.OpenReadStream();
        var result = await books.ImportCsvAsync(stream, cancellationToken);
        LogImportResult(file.FileName, result);
        return Ok(result);
    }

    /// <summary>
    /// Bulk import books from an XML file.
    /// </summary>
    [HttpPost("import/xml")]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkImportResult>> ImportXml(IFormFile file, CancellationToken cancellationToken)
    {
        if (!IsValidUpload(file))
        {
            return InvalidFile(".xml");
        }

        logger.LogInformation("Starting XML import. File={FileName}, Size={Size}", file.FileName, file.Length);
        await using var stream = file.OpenReadStream();
        var result = await books.ImportXmlAsync(stream, cancellationToken);
        LogImportResult(file.FileName, result);
        return Ok(result);
    }

    private void LogImportResult(string fileName, BulkImportResult result)
    {
        logger.LogInformation(
            "Import finished for {FileName}. Total={Total}, Imported={Imported}, Skipped={Skipped}",
            fileName,
            result.TotalRows,
            result.ImportedCount,
            result.SkippedCount);

        if (result.Errors.Count > 0)
        {
            logger.LogWarning(
                "Import for {FileName} had {ErrorCount} row errors",
                fileName,
                result.Errors.Count);
        }
    }

    private static bool IsValidUpload(IFormFile? file)
        => file is not null && file.Length > 0;

    private BadRequestObjectResult InvalidFile(string formats)
        => BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
        {
            ["file"] = [$"A non-empty {formats} file is required."]
        }));
}
