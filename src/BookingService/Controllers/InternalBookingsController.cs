using BookingService.DTOs;
using BookingService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace BookingService.Controllers;

/// <summary>Service-to-service lifecycle hooks (Workers). Requires X-Internal-Api-Key.</summary>
[ApiController]
[Route("api/internal/bookings")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.InternalService)]
public class InternalBookingsController(LoanLifecycleService lifecycle) : ControllerBase
{
    [HttpPost("mark-overdue")]
    [ProducesResponseType(typeof(LifecycleBatchResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<LifecycleBatchResult>> MarkOverdue(CancellationToken cancellationToken)
        => Ok(await lifecycle.MarkOverdueAsync(cancellationToken));

    [HttpPost("due-reminders")]
    [ProducesResponseType(typeof(LifecycleBatchResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<LifecycleBatchResult>> DueReminders(CancellationToken cancellationToken)
        => Ok(await lifecycle.QueueDueRemindersAsync(cancellationToken));
}
