using BookingService.DTOs;
using BookingService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Pagination;

namespace BookingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BookingsController(IBookingService bookings, ILogger<BookingsController> logger) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [ProducesResponseType(typeof(PagedResult<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<BookingDto>>> Get(
        [FromQuery] BookingQueryFilter filter,
        CancellationToken cancellationToken)
    {
        if (!User.IsStaff())
        {
            var email = User.GetEmail();
            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(new
                {
                    title = "Unauthorized",
                    detail = "Token neobsahuje email používateľa.",
                });
            }

            filter.BorrowerEmail = email;
        }

        logger.LogInformation(
            "Searching bookings. Page={Page}, PageSize={PageSize}, Search={Search}, Status={Status}, Actor={Actor}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.Status,
            LogRedaction.HashForLog(User.GetObjectId() ?? User.GetEmail()));

        var result = await bookings.SearchAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var booking = await bookings.GetByIdAsync(id, cancellationToken);

        if (!User.IsStaff())
        {
            var email = User.GetEmail();
            if (string.IsNullOrWhiteSpace(email)
                || !string.Equals(booking.BorrowerEmail, email, StringComparison.OrdinalIgnoreCase))
            {
                // Hide existence of foreign bookings from non-staff callers.
                return NotFound();
            }
        }

        return Ok(booking);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BookingDto>> Create(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(new
            {
                title = "Unauthorized",
                detail = "Token neobsahuje email používateľa.",
            });
        }

        request.BorrowerEmail = email;
        var name = User.GetDisplayName();
        if (!string.IsNullOrWhiteSpace(name))
        {
            request.BorrowerName = name;
        }

        logger.LogInformation(
            "Creating booking for book {BookId} by actor {ActorHash}",
            request.BookId,
            LogRedaction.HashForLog(User.GetObjectId() ?? email));

        var created = await bookings.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<BookingDto>> Update(
        Guid id,
        [FromBody] UpdateBookingRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Updating booking {BookingId} by actor {ActorHash}",
            id,
            LogRedaction.HashForLog(User.GetObjectId() ?? User.GetEmail()));
        return Ok(await bookings.UpdateAsync(id, request, cancellationToken));
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
        logger.LogWarning(
            "Deleting booking {BookingId} by actor {ActorHash}",
            id,
            LogRedaction.HashForLog(User.GetObjectId() ?? User.GetEmail()));
        await bookings.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
