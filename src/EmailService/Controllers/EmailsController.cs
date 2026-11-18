using EmailService.DTOs;
using EmailService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

namespace EmailService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmailsController(IEmailDispatchService emails, IAuditLogger audit) : ControllerBase
{
    [HttpGet("status")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [ProducesResponseType(typeof(EmailServiceStatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailServiceStatusDto>> Status(CancellationToken cancellationToken)
        => Ok(await emails.GetStatusAsync(cancellationToken));

    [HttpGet]
    [Authorize(Policy = AuthPolicies.Staff)]
    [ProducesResponseType(typeof(IReadOnlyList<EmailMessageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EmailMessageDto>>> List(
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
        => Ok(await emails.ListRecentAsync(take, cancellationToken));

    [HttpGet("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmailMessageDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await emails.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("send")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> Send(
        [FromBody] SendEmailRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.SendAsync(request, cancellationToken);
            audit.StaffAction(User, "email.send", "EmailMessage", sent.Id.ToString(), new
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
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> LoanDueReminder(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.SendLoanDueReminderAsync(request, cancellationToken);
            audit.StaffAction(
                User,
                "email.template.loan-due-reminder",
                "EmailMessage",
                sent.Id.ToString(),
                new { sent.TemplateKey, Status = sent.Status.ToString() });
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
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> WaitlistPromotion(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.SendWaitlistPromotionAsync(request, cancellationToken);
            audit.StaffAction(
                User,
                "email.template.waitlist-promotion",
                "EmailMessage",
                sent.Id.ToString(),
                new { sent.TemplateKey, Status = sent.Status.ToString() });
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

    [HttpPost("{id:guid}/resend")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailMessageDto>> Resend(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var sent = await emails.ResendAsync(id, cancellationToken);
            audit.StaffAction(User, "email.resend", "EmailMessage", sent.Id.ToString(), new
            {
                SourceId = id,
                sent.TemplateKey,
                Status = sent.Status.ToString(),
            });
            return Ok(sent);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
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
