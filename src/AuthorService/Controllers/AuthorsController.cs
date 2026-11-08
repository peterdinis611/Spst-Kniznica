using AuthorService.DTOs;
using AuthorService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Pagination;

namespace AuthorService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthorsController(IAuthorService authors, ILogger<AuthorsController> logger) : ControllerBase
{
    [HttpGet]
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

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuthorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthorDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await authors.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AuthorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthorDto>> Create(
        [FromBody] CreateAuthorRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating author '{Name}'", request.Name);
        var created = await authors.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AuthorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthorDto>> Update(
        Guid id,
        [FromBody] UpdateAuthorRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Updating author {AuthorId}", id);
        return Ok(await authors.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        logger.LogWarning("Deleting author {AuthorId}", id);
        await authors.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
