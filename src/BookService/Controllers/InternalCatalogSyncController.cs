using BookService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace BookService.Controllers;

/// <summary>
/// HTTP fallback when Kafka is disabled — Category/Author/Booking push denorm updates here.
/// </summary>
[ApiController]
[Route("api/internal/catalog")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.InternalService)]
public sealed class InternalCatalogSyncController(
    CatalogDenormalizationService catalogDenorm,
    BookingCopyDenormalizationService bookingCopyDenorm) : ControllerBase
{
    public sealed record CatalogSyncEventBody(string EventType, string Payload);

    public sealed record CategoryUpdatedBody(Guid CategoryId, string Name);
    public sealed record CategoryDeletedBody(Guid CategoryId);
    public sealed record AuthorUpdatedBody(Guid AuthorId, string Name);
    public sealed record AuthorDeletedBody(Guid AuthorId);

    /// <summary>
    /// Generic event fan-in (preferred for publishers).
    /// </summary>
    [HttpPost("events")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ApplyEvent(
        [FromBody] CatalogSyncEventBody body,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body.EventType) || string.IsNullOrWhiteSpace(body.Payload))
        {
            return BadRequest();
        }

        await catalogDenorm.ApplyEventPayloadAsync(body.EventType, body.Payload, cancellationToken);
        await bookingCopyDenorm.ApplyEventPayloadAsync(body.EventType, body.Payload, cancellationToken);
        return NoContent();
    }

    [HttpPost("categories/updated")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CategoryUpdated(
        [FromBody] CategoryUpdatedBody body,
        CancellationToken cancellationToken)
    {
        await catalogDenorm.ApplyCategoryUpdatedAsync(body.CategoryId, body.Name, cancellationToken);
        return NoContent();
    }

    [HttpPost("categories/deleted")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CategoryDeleted(
        [FromBody] CategoryDeletedBody body,
        CancellationToken cancellationToken)
    {
        await catalogDenorm.ApplyCategoryDeletedAsync(body.CategoryId, cancellationToken);
        return NoContent();
    }

    [HttpPost("authors/updated")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AuthorUpdated(
        [FromBody] AuthorUpdatedBody body,
        CancellationToken cancellationToken)
    {
        await catalogDenorm.ApplyAuthorUpdatedAsync(body.AuthorId, body.Name, cancellationToken);
        return NoContent();
    }

    [HttpPost("authors/deleted")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AuthorDeleted(
        [FromBody] AuthorDeletedBody body,
        CancellationToken cancellationToken)
    {
        await catalogDenorm.ApplyAuthorDeletedAsync(body.AuthorId, cancellationToken);
        return NoContent();
    }
}
