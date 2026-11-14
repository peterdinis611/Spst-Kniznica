using BookingService.DTOs;
using BookingService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

namespace BookingService.Controllers;

[ApiController]
[Route("api/bookings")]
[Produces("application/json")]
public class LibraryOpsController(
    LoanLifecycleService lifecycle,
    WaitlistService waitlist,
    FavoritesService favorites,
    Interfaces.IBookingService bookings,
    IAuditLogger audit) : ControllerBase
{
    [HttpGet("policy")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoanPolicyDto), StatusCodes.Status200OK)]
    public ActionResult<LoanPolicyDto> GetPolicy() => Ok(lifecycle.GetPolicy());

    [HttpGet("desk/daily")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [ProducesResponseType(typeof(DeskDailyDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DeskDailyDto>> DailyBoard(CancellationToken cancellationToken)
        => Ok(await lifecycle.GetDailyBoardAsync(cancellationToken));

    [HttpGet("desk/daily.csv")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [Produces("text/csv")]
    public async Task<IActionResult> DailyBoardCsv(CancellationToken cancellationToken)
    {
        var board = await lifecycle.GetDailyBoardAsync(cancellationToken);
        var lines = new List<string>
        {
            "section,id,bookId,borrowerName,borrowerEmail,status,dueDate",
        };

        void Add(string section, IEnumerable<BookingDto> items)
        {
            foreach (var item in items)
            {
                lines.Add(string.Join(',',
                    section,
                    item.Id,
                    item.BookId,
                    Csv(item.BorrowerName),
                    Csv(item.BorrowerEmail),
                    item.Status,
                    item.DueDate.ToString("o")));
            }
        }

        Add("overdue", board.Overdue);
        Add("dueSoon", board.DueSoon);
        Add("pickup", board.PickupReady);

        var csv = string.Join('\n', lines) + '\n';
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"desk-daily-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BookingDto>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var existing = await bookings.GetByIdAsync(id, cancellationToken);
        if (!User.IsStaff())
        {
            var email = User.GetEmail();
            if (string.IsNullOrWhiteSpace(email)
                || !string.Equals(existing.BorrowerEmail, email, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound();
            }
        }

        var updated = await bookings.CancelAsync(id, cancellationToken);
        audit.StaffAction(User, "booking.cancel", "Booking", id.ToString(), new { updated.Status });
        return Ok(updated);
    }

    [HttpPost("{id:guid}/renew")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BookingDto>> Renew(
        Guid id,
        [FromBody] RenewBookingRequest? request,
        CancellationToken cancellationToken)
    {
        var existing = await bookings.GetByIdAsync(id, cancellationToken);
        if (!User.IsStaff())
        {
            var email = User.GetEmail();
            if (string.IsNullOrWhiteSpace(email)
                || !string.Equals(existing.BorrowerEmail, email, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound();
            }
        }

        var updated = await bookings.RenewAsync(id, request?.ExtraDays, cancellationToken);
        audit.StaffAction(User, "booking.renew", "Booking", id.ToString(), new { updated.DueDate, updated.RenewalCount });
        return Ok(updated);
    }

    [HttpPost("waitlist")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(WaitlistEntryDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<WaitlistEntryDto>> JoinWaitlist(
        [FromBody] JoinWaitlistRequest request,
        CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();
        request.BorrowerEmail = email;
        var name = User.GetDisplayName();
        if (!string.IsNullOrWhiteSpace(name)) request.BorrowerName = name;

        var entry = await waitlist.JoinAsync(request, cancellationToken);
        return Created($"/api/bookings/waitlist/{entry.Id}", entry);
    }

    [HttpGet("waitlist/mine")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [ProducesResponseType(typeof(IReadOnlyList<WaitlistEntryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<WaitlistEntryDto>>> MyWaitlist(
        CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();
        return Ok(await waitlist.ListForBorrowerAsync(email, cancellationToken));
    }

    [HttpGet("waitlist/book/{bookId:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [ProducesResponseType(typeof(IReadOnlyList<WaitlistEntryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<WaitlistEntryDto>>> WaitlistForBook(
        Guid bookId,
        CancellationToken cancellationToken)
        => Ok(await waitlist.ListForBookAsync(bookId, cancellationToken));

    [HttpDelete("waitlist/{id:guid}")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LeaveWaitlist(Guid id, CancellationToken cancellationToken)
    {
        await waitlist.LeaveAsync(id, User.GetEmail(), User.IsStaff(), cancellationToken);
        return NoContent();
    }

    [HttpGet("favorites")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [ProducesResponseType(typeof(IReadOnlyList<FavoriteBookDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FavoriteBookDto>>> ListFavorites(
        [FromQuery] string? listName,
        CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();
        return Ok(await favorites.ListAsync(email, listName, cancellationToken));
    }

    [HttpPost("favorites")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(FavoriteBookDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<FavoriteBookDto>> AddFavorite(
        [FromBody] AddFavoriteRequest request,
        CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();
        var created = await favorites.AddAsync(email, request, cancellationToken);
        return Created($"/api/bookings/favorites/{created.Id}", created);
    }

    [HttpDelete("favorites/{id:guid}")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFavorite(Guid id, CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();
        await favorites.RemoveAsync(id, email, cancellationToken);
        return NoContent();
    }

    [HttpDelete("favorites/book/{bookId:guid}")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFavoriteByBook(
        Guid bookId,
        [FromQuery] string? listName,
        CancellationToken cancellationToken)
    {
        var email = User.GetEmail();
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();
        await favorites.RemoveByBookAsync(bookId, email, listName, cancellationToken);
        return NoContent();
    }

    private static string Csv(string value)
        => $"\"{value.Replace("\"", "\"\"")}\"";
}
