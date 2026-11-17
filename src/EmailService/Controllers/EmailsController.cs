using EmailService.DTOs;
using EmailService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;

namespace EmailService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmailsController(IEmailDispatchService emails) : ControllerBase
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
}
