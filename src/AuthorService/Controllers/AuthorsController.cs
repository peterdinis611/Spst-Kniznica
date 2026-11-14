using AuthorService.DTOs;
using AuthorService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Export;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Pagination;

namespace AuthorService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthorsController(
    IAuthorService authors,
    IAuditLogger audit,
    ILogger<AuthorsController> logger) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
    [ProducesResponseType(typeof(PagedResult<AuthorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<AuthorDto>>> Get(
        [FromQuery] AuthorQueryFilter filter,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Searching authors. Page={Page}, PageSize={PageSize}, Search={Search}, SortBy={SortBy}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.SortBy);

        return Ok(await authors.SearchAsync(filter, cancellationToken));
    }

    [HttpGet("export")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.DataExportPolicy)]
    [Produces("text/csv", "application/xml")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Export(
        [FromQuery] AuthorQueryFilter filter,
        [FromQuery] ExportQuery export,
        CancellationToken cancellationToken)
    {
        export.Normalize();
        var items = await ExportPaging.CollectAsync(
            filter,
            authors.SearchAsync,
            export.Take,
            cancellationToken);

        string[] headers =
        [
            "id", "name", "biography", "nationality", "birthYear", "isActive", "createdAt", "updatedAt",
        ];

        var rows = items.Select(a => (IReadOnlyList<string?>)
        [
            SecureTabularExport.Cell(a.Id),
            SecureTabularExport.Cell(a.Name),
            SecureTabularExport.Cell(a.Biography),
            SecureTabularExport.Cell(a.Nationality),
            SecureTabularExport.Cell(a.BirthYear),
            SecureTabularExport.Cell(a.IsActive),
            SecureTabularExport.Cell(a.CreatedAt),
            SecureTabularExport.Cell(a.UpdatedAt),
        ]);

        audit.StaffAction(User, "author.export", "Author", export.Format, new
        {
            export.Format,
            Count = items.Count,
            Cap = export.Take,
        });

        return ExportFileResult.Create(this, export.ResolvedFormat, "authors", headers, rows, "authors", "author");
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
    [ProducesResponseType(typeof(AuthorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthorDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await authors.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(AuthorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthorDto>> Create(
        [FromBody] CreateAuthorRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating author '{Name}'", request.Name);
        var created = await authors.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(AuthorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthorDto>> Update(
        Guid id,
        [FromBody] UpdateAuthorRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Updating author {AuthorId}", id);
        return Ok(await authors.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        logger.LogWarning("Deleting author {AuthorId}", id);
        await authors.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
