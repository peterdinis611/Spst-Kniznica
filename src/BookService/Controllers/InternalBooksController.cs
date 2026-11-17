using BookService.DTOs;
using BookService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace BookService.Controllers;

/// <summary>
/// Service-to-service endpoints — not routed through the public gateway.
/// Requires <c>X-Internal-Api-Key</c>.
/// </summary>
[ApiController]
[Route("api/internal/books")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.InternalService)]
public class InternalBooksController(IBooksService books) : ControllerBase
{
    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(BookCatalogSnapshot), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookCatalogSnapshot>> GetAvailability(
        Guid id,
        CancellationToken cancellationToken)
    {
        var book = await books.GetByIdAsync(id, cancellationToken);
        return Ok(ToSnapshot(book));
    }

    [HttpPost("summaries")]
    [ProducesResponseType(typeof(IReadOnlyList<BookCatalogSnapshot>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BookCatalogSnapshot>>> GetSummaries(
        [FromBody] BookSummariesRequest request,
        CancellationToken cancellationToken)
    {
        var ids = (request.Ids ?? [])
            .Where(id => id != Guid.Empty)
            .Distinct()
            .Take(100)
            .ToArray();

        if (ids.Length == 0)
        {
            return Ok(Array.Empty<BookCatalogSnapshot>());
        }

        var items = await books.GetSummariesAsync(ids, cancellationToken);
        return Ok(items);
    }

    private static BookCatalogSnapshot ToSnapshot(BookDetailDto book) => new()
    {
        BookId = book.Id,
        Title = book.Title,
        Author = book.Author,
        TotalCopies = book.TotalCopies,
        AvailableCopies = book.AvailableCopies,
    };
}
