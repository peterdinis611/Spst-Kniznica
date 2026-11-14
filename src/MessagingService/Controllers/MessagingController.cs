using MessagingService.DTOs;
using MessagingService.Interfaces;
using MessagingService.Messaging.Kafka;
using MessagingService.Messaging.RabbitMq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MessagingController(
    IEnumerable<IEventPublisher> publishers,
    ILogger<MessagingController> logger) : ControllerBase
{
    /// <summary>
    /// Publish a ping event to Kafka, RabbitMQ, or both.
    /// </summary>
    [HttpPost("publish")]
    [Authorize(Policy = AuthPolicies.Staff)]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Publish(
        [FromBody] PublishMessageRequest request,
        CancellationToken cancellationToken)
    {
        var target = (request.Target ?? "all").Trim().ToLowerInvariant();
        var ping = new PingEvent(request.Source, request.Message);

        var selected = publishers.Where(publisher => target switch
        {
            "kafka" => publisher is KafkaEventPublisher,
            "rabbitmq" or "rabbit" => publisher is RabbitMqEventPublisher,
            "all" => true,
            _ => false
        }).ToList();

        if (selected.Count == 0)
        {
            return BadRequest(new
            {
                error = "No publishers matched. Use target=all|kafka|rabbitmq"
            });
        }

        foreach (var publisher in selected)
        {
            await publisher.PublishAsync(ping, cancellationToken);
            logger.LogInformation(
                "Ping published via {Transport}. Source={Source}",
                publisher.TransportName,
                ping.Source);
        }

        return Accepted(new
        {
            eventId = ping.EventId,
            eventType = ping.EventType,
            transports = selected.Select(p => p.TransportName).ToArray()
        });
    }

    [HttpGet("status")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingServiceCollectionExtensions.PublicReadPolicy)]
    public ActionResult<object> Status([FromServices] IConfiguration configuration)
    {
        return Ok(new
        {
            application = "MessagingService",
            kafkaEnabled = configuration.GetValue("Kafka:Enabled", true),
            rabbitMqEnabled = configuration.GetValue("RabbitMq:Enabled", true),
            kafkaBootstrap = configuration["Kafka:BootstrapServers"],
            rabbitHost = configuration["RabbitMq:HostName"]
        });
    }
}
