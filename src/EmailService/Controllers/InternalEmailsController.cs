using EmailService.DTOs;
using EmailService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace EmailService.Controllers;

/// <summary>
/// Service-to-service send endpoints — requires <c>X-Internal-Api-Key</c>.
/// </summary>
[ApiController]
[Route("api/internal/emails")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.InternalService)]
public class InternalEmailsController(IEmailDispatchService emails, IAuditLogger audit) : ControllerBase
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
            audit.ServiceAction("email.send", "EmailMessage", sent.Id.ToString(), new
            {
                sent.TemplateKey,
                Status = sent.Status.ToString(),
            });
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
            audit.ServiceAction(
                "email.template.loan-due-reminder",
                "EmailMessage",
                sent.Id.ToString(),
                new
                {
                    sent.TemplateKey,
                    Status = sent.Status.ToString(),
                });
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
            audit.ServiceAction(
                "email.template.waitlist-promotion",
                "EmailMessage",
                sent.Id.ToString(),
                new
                {
                    sent.TemplateKey,
                    Status = sent.Status.ToString(),
                });
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
