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

    [HttpPost("templates/loan-borrowed")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<EmailMessageDto>> LoanBorrowed(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
        => SendStaffTemplate(request, "loan-borrowed", emails.SendLoanBorrowedAsync, cancellationToken);

    [HttpPost("templates/loan-returned")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<EmailMessageDto>> LoanReturned(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
        => SendStaffTemplate(request, "loan-returned", emails.SendLoanReturnedAsync, cancellationToken);

    [HttpPost("templates/loan-due-reminder")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<EmailMessageDto>> LoanDueReminder(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
        => SendStaffTemplate(request, "loan-due-reminder", emails.SendLoanDueReminderAsync, cancellationToken);

    [HttpPost("templates/waitlist-promotion")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EmailMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<EmailMessageDto>> WaitlistPromotion(
        [FromBody] LoanEmailTemplateRequest request,
        CancellationToken cancellationToken)
        => SendStaffTemplate(request, "waitlist-promotion", emails.SendWaitlistPromotionAsync, cancellationToken);

    private async Task<ActionResult<EmailMessageDto>> SendStaffTemplate(
        LoanEmailTemplateRequest request,
        string auditAction,
        Func<LoanEmailTemplateRequest, CancellationToken, Task<EmailMessageDto>> send,
        CancellationToken cancellationToken)
    {
        try
        {
            var sent = await send(request, cancellationToken);
            audit.StaffAction(
                User,
                $"email.template.{auditAction}",
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
