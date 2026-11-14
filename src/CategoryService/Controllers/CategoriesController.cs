using CategoryService.DTOs;
using CategoryService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Export;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Pagination;

namespace CategoryService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CategoriesController(
    ICategoryService categories,
    IAuditLogger audit,
    ILogger<CategoriesController> logger) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
    [ProducesResponseType(typeof(PagedResult<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<CategoryDto>>> Get(
        [FromQuery] CategoryQueryFilter filter,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Searching categories. Page={Page}, PageSize={PageSize}, Search={Search}, SortBy={SortBy}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.SortBy);

        var result = await categories.SearchAsync(filter, cancellationToken);
        return Ok(result);
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
        [FromQuery] CategoryQueryFilter filter,
        [FromQuery] ExportQuery export,
        CancellationToken cancellationToken)
    {
        export.Normalize();
        var items = await ExportPaging.CollectAsync(
            filter,
            categories.SearchAsync,
            export.Take,
            cancellationToken);

        string[] headers =
        [
            "id", "name", "description", "color", "isActive", "createdAt", "updatedAt",
        ];

        var rows = items.Select(c => (IReadOnlyList<string?>)
        [
            SecureTabularExport.Cell(c.Id),
            SecureTabularExport.Cell(c.Name),
            SecureTabularExport.Cell(c.Description),
            SecureTabularExport.Cell(c.Color),
            SecureTabularExport.Cell(c.IsActive),
            SecureTabularExport.Cell(c.CreatedAt),
            SecureTabularExport.Cell(c.UpdatedAt),
        ]);

        audit.StaffAction(User, "category.export", "Category", export.Format, new
        {
            export.Format,
            Count = items.Count,
            Cap = export.Take,
        });

        return ExportFileResult.Create(
            this,
            export.ResolvedFormat,
            "categories",
            headers,
            rows,
            "categories",
            "category");
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await categories.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CategoryDto>> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating category '{Name}'", request.Name);
        var created = await categories.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CategoryDto>> Update(
        Guid id,
        [FromBody] UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Updating category {CategoryId}", id);
        return Ok(await categories.UpdateAsync(id, request, cancellationToken));
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
        logger.LogWarning("Deleting category {CategoryId}", id);
        await categories.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
