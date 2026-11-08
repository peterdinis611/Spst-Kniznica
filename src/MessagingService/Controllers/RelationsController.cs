using MessagingService.DTOs;
using MessagingService.Services;
using Microsoft.AspNetCore.Mvc;

namespace MessagingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RelationsController(ILibraryRelationService relations) : ControllerBase
{
    /// <summary>
    /// One category with book count (1 category → N books).
    /// </summary>
    [HttpGet("categories/{categoryId:guid}")]
    [ProducesResponseType(typeof(CategoryRelationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryRelationDto>> GetCategory(Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await relations.GetCategoryAsync(categoryId, cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    /// <summary>
    /// All books linked to a category.
    /// </summary>
    [HttpGet("categories/{categoryId:guid}/books")]
    [ProducesResponseType(typeof(IReadOnlyList<BookRelationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BookRelationDto>>> GetBooksByCategory(
        Guid categoryId,
        CancellationToken cancellationToken)
    {
        return Ok(await relations.GetBooksByCategoryAsync(categoryId, cancellationToken));
    }

    /// <summary>
    /// One book with its single category (1 book → 1 category).
    /// </summary>
    [HttpGet("books/{bookId:guid}")]
    [ProducesResponseType(typeof(BookRelationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookRelationDto>> GetBook(Guid bookId, CancellationToken cancellationToken)
    {
        var book = await relations.GetBookAsync(bookId, cancellationToken);
        return book is null ? NotFound() : Ok(book);
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(RelationSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<RelationSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        return Ok(await relations.GetSummaryAsync(cancellationToken));
    }
}
