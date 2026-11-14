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
    [ProducesResponseType(typeof(BookAvailabilityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookAvailabilityResponse>> GetAvailability(
        Guid id,
        CancellationToken cancellationToken)
    {
        var book = await books.GetByIdAsync(id, cancellationToken);
        return Ok(new BookAvailabilityResponse
        {
            BookId = book.Id,
            TotalCopies = book.TotalCopies,
            AvailableCopies = book.AvailableCopies,
        });
    }
}

public sealed class BookAvailabilityResponse
{
    public Guid BookId { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
}
