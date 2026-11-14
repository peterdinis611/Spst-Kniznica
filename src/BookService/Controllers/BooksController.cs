using BookService.DTOs;
using BookService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Export;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Integrations;
using SpstKniznica.Common.Pagination;

namespace BookService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BooksController(
    IBooksService books,
    IsbnCatalogLookup isbnLookup,
    TurnstileVerifier turnstile,
    IAuditLogger audit,
    ILogger<BooksController> logger) : ControllerBase
{
    /// <summary>
    /// Search books with filtering, sorting and pagination.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
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
    /// ISBN metadata lookup via Open Library (WorldCat fallback when configured).
    /// </summary>
    [HttpGet("lookup/isbn/{isbn}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
    [ProducesResponseType(typeof(IsbnLookupResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IsbnLookupResult>> LookupIsbn(
        string isbn,
        CancellationToken cancellationToken)
    {
        var result = await isbnLookup.LookupAsync(isbn, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Export books as CSV or XML (staff). Cap <paramref name="export"/>.Take at 5000.
    /// </summary>
    [HttpGet("export")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.DataExportPolicy)]
    [Produces("text/csv", "application/xml")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Export(
        [FromQuery] BookQueryFilter filter,
        [FromQuery] ExportQuery export,
        CancellationToken cancellationToken)
    {
        export.Normalize();
        var items = await ExportPaging.CollectAsync(
            filter,
            books.SearchAsync,
            export.Take,
            cancellationToken);

        string[] headers =
        [
            "id", "title", "subtitle", "authorId", "author", "publisher", "isbn",
            "publishedYear", "language", "categoryId", "categoryName", "format",
            "shelfLocation", "totalCopies", "availableCopies",
        ];

        var rows = items.Select(b => (IReadOnlyList<string?>)
        [
            SecureTabularExport.Cell(b.Id),
            SecureTabularExport.Cell(b.Title),
            SecureTabularExport.Cell(b.Subtitle),
            SecureTabularExport.Cell(b.AuthorId),
            SecureTabularExport.Cell(b.Author),
            SecureTabularExport.Cell(b.Publisher),
            SecureTabularExport.Cell(b.Isbn),
            SecureTabularExport.Cell(b.PublishedYear),
            SecureTabularExport.Cell(b.Language),
            SecureTabularExport.Cell(b.CategoryId),
            SecureTabularExport.Cell(b.CategoryName),
            SecureTabularExport.Cell(b.Format),
            SecureTabularExport.Cell(b.ShelfLocation),
            SecureTabularExport.Cell(b.TotalCopies),
            SecureTabularExport.Cell(b.AvailableCopies),
        ]);

        audit.StaffAction(User, "book.export", "Book", export.Format, new
        {
            export.Format,
            Count = items.Count,
            Cap = export.Take,
        });

        return ExportFileResult.Create(this, export.ResolvedFormat, "books", headers, rows, "books", "book");
    }

    /// <summary>
    /// Get a book including all physical copies (barcode / inventory number).
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
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
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(BookDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BookDetailDto>> Create(
        [FromBody] CreateBookRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating book '{Title}' for author {AuthorId}", request.Title, request.AuthorId);
        var created = await books.CreateAsync(request, cancellationToken);
        audit.StaffAction(User, "book.create", "Book", created.Id.ToString(), new { created.Title });
        logger.LogInformation("Book created successfully with id {BookId}", created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Update a book and adjust copy count when needed.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(BookDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BookDetailDto>> Update(
        Guid id,
        [FromBody] UpdateBookRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Updating book {BookId}", id);
        var book = await books.UpdateAsync(id, request, cancellationToken);
        audit.StaffAction(User, "book.update", "Book", id.ToString(), new { book.Title });
        return Ok(book);
    }

    /// <summary>
    /// Delete a book when no copies are borrowed/reserved.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        logger.LogWarning("Deleting book {BookId}", id);
        await books.DeleteAsync(id, cancellationToken);
        audit.StaffAction(User, "book.delete", "Book", id.ToString());
        return NoContent();
    }

    /// <summary>
    /// Bulk import books from CSV, XML or Excel (.xlsx) based on file extension.
    /// </summary>
    [HttpPost("import")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BulkImportResult>> Import(
        IFormFile file,
        [FromForm] string? turnstileToken,
        CancellationToken cancellationToken)
    {
        if (!IsValidUpload(file))
        {
            return InvalidFile(".csv, .xml or .xlsx");
        }

        if (!await turnstile.VerifyAsync(turnstileToken, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken))
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["turnstileToken"] = ["Cloudflare Turnstile overenie zlyhalo."]
            }));
        }

        logger.LogInformation("Starting bulk import. File={FileName}, Size={Size}", file.FileName, file.Length);
        await using var stream = file.OpenReadStream();
        var result = await books.ImportAsync(stream, file.FileName, cancellationToken);
        audit.StaffAction(User, "book.import", "Book", file.FileName, new
        {
            result.TotalRows,
            result.ImportedCount,
            result.SkippedCount,
        });
        LogImportResult(file.FileName, result);
        return Ok(result);
    }

    /// <summary>
    /// Bulk import books from a CSV file.
    /// </summary>
    [HttpPost("import/csv")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BulkImportResult>> ImportCsv(IFormFile file, CancellationToken cancellationToken)
    {
        if (!IsValidUpload(file))
        {
            return InvalidFile(".csv");
        }

        logger.LogInformation("Starting CSV import. File={FileName}, Size={Size}", file.FileName, file.Length);
        await using var stream = file.OpenReadStream();
        var result = await books.ImportCsvAsync(stream, cancellationToken);
        audit.StaffAction(User, "book.import", "Book", file.FileName, new
        {
            Format = "csv",
            result.TotalRows,
            result.ImportedCount,
            result.SkippedCount,
        });
        LogImportResult(file.FileName, result);
        return Ok(result);
    }

    /// <summary>
    /// Bulk import books from an XML file.
    /// </summary>
    [HttpPost("import/xml")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BulkImportResult>> ImportXml(IFormFile file, CancellationToken cancellationToken)
    {
        if (!IsValidUpload(file))
        {
            return InvalidFile(".xml");
        }

        logger.LogInformation("Starting XML import. File={FileName}, Size={Size}", file.FileName, file.Length);
        await using var stream = file.OpenReadStream();
        var result = await books.ImportXmlAsync(stream, cancellationToken);
        audit.StaffAction(User, "book.import", "Book", file.FileName, new
        {
            Format = "xml",
            result.TotalRows,
            result.ImportedCount,
            result.SkippedCount,
        });
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
