using BookingService.DTOs;
using BookingService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Pagination;

namespace BookingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BookingsController(IBookingService bookings, ILogger<BookingsController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<BookingDto>>> Get(
        [FromQuery] BookingQueryFilter filter,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Searching bookings. Page={Page}, PageSize={PageSize}, Search={Search}, Status={Status}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.Status);

        var result = await bookings.SearchAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await bookings.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingDto>> Create(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Creating booking for book {BookId} by {BorrowerEmail}",
            request.BookId,
            request.BorrowerEmail);
        var created = await bookings.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingDto>> Update(
        Guid id,
        [FromBody] UpdateBookingRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Updating booking {BookingId}", id);
        return Ok(await bookings.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        logger.LogWarning("Deleting booking {BookingId}", id);
        await bookings.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
