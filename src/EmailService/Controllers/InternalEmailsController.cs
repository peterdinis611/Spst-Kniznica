using EmailService.DTOs;
using EmailService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace EmailService.Controllers;

/// <summary>
/// Service-to-service send endpoints — requires <c>X-Internal-Api-Key</c>.
/// Audit for send/fail is written inside <see cref="IEmailDispatchService"/>.
/// </summary>
[ApiController]
[Route("api/internal/emails")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.InternalService)]
public class InternalEmailsController(IEmailDispatchService emails) : ControllerBase
{
    [HttpPost("send")]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> Send(
        [FromBody] SendEmailRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.SendAsync(request, cancellationToken);
            return Ok(sent);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { detail = ex.Message });
        }
    }

    [HttpPost("templates/loan-due-reminder")]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> LoanDueReminder(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.SendLoanDueReminderAsync(request, cancellationToken);
            return Ok(sent);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { detail = ex.Message });
        }
    }

    [HttpPost("templates/waitlist-promotion")]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> WaitlistPromotion(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.SendWaitlistPromotionAsync(request, cancellationToken);
            return Ok(sent);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { detail = ex.Message });
        }
    }
}
