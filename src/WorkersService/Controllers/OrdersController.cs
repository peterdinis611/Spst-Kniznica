using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Auth;
using WorkersService.DTOs;
using WorkersService.Jobs;
using WorkersService.Queue;

namespace WorkersService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OrdersController(
    IOrderJobQueue queue,
    ILogger<OrdersController> logger) : ControllerBase
{
    [HttpPost("enqueue")]
    [Authorize(Policy = AuthPolicies.Authenticated)]
    [ProducesResponseType(typeof(EnqueueOrderResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EnqueueOrderResponse>> Enqueue(
        [FromBody] EnqueueOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.OrderId))
        {
            return BadRequest(new
            {
                title = "Validation failed",
                status = 400,
                errors = new Dictionary<string, string[]>
                {
                    ["orderId"] = ["orderId is required."]
                }
            });
        }

        var job = await queue.EnqueueAsync(request.OrderId, cancellationToken);
        logger.LogInformation(
            "Enqueued order job {JobId} for order {OrderId}",
            job.JobId,
            job.OrderId);

        return Accepted(new EnqueueOrderResponse
        {
            Accepted = true,
            JobId = job.JobId,
            OrderId = job.OrderId,
            Queue = OrderProcessingHostedService.QueueName,
            Name = OrderProcessingHostedService.JobName
        });
    }
}
