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
public class InternalBookingsController(LoanLifecycleService lifecycle, IAuditLogger audit) : ControllerBase
{
    [HttpPost("mark-overdue")]
    [ProducesResponseType(typeof(LifecycleBatchResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<LifecycleBatchResult>> MarkOverdue(CancellationToken cancellationToken)
    {
        var result = await lifecycle.MarkOverdueAsync(cancellationToken);
        audit.ServiceAction(
            "booking.lifecycle.mark-overdue",
            "Booking",
            "batch",
            new { result.MarkedOverdue, Count = result.OverdueIds.Count });
        return Ok(result);
    }

    [HttpPost("due-reminders")]
    [ProducesResponseType(typeof(LifecycleBatchResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<LifecycleBatchResult>> DueReminders(CancellationToken cancellationToken)
    {
        var result = await lifecycle.QueueDueRemindersAsync(cancellationToken);
        audit.ServiceAction(
            "booking.lifecycle.due-reminders",
            "Booking",
            "batch",
            new { result.RemindersQueued, Count = result.ReminderBookingIds.Count });
        return Ok(result);
    }
}
