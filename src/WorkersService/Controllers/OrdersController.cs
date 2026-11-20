using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;
using WorkersService.DTOs;
using WorkersService.Jobs;
using WorkersService.Queue;

namespace WorkersService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OrdersController(
    IOrderJobQueue queue,
    IAuditLogger audit,
    ILogger<OrdersController> logger) : ControllerBase
{
    [HttpGet("queue")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [ProducesResponseType(typeof(OrderQueueStatusDto), StatusCodes.Status200OK)]
    public ActionResult<OrderQueueStatusDto> QueueStatus()
        => Ok(new OrderQueueStatusDto
        {
            PendingCount = queue.PendingCount,
            Queue = OrderProcessingHostedService.QueueName,
            JobName = OrderProcessingHostedService.JobName,
        });

    [HttpPost("enqueue")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(typeof(EnqueueOrderResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
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

        audit.StaffAction(User, "order.enqueue", "OrderJob", job.JobId.ToString(), new
        {
            job.OrderId,
            Queue = OrderProcessingHostedService.QueueName,
        });

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
