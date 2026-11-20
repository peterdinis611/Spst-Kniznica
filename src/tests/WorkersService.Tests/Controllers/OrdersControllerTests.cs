using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Common.Auth;
using WorkersService.Controllers;
using WorkersService.DTOs;
using WorkersService.Jobs;
using WorkersService.Queue;

namespace WorkersService.Tests.Controllers;

public class OrdersControllerTests
{
    [Fact]
    public void QueueStatus_returns_pending_count_and_queue_name()
    {
        var queue = Substitute.For<IOrderJobQueue>();
        queue.PendingCount.Returns(3);
        var audit = Substitute.For<IAuditLogger>();
        var sut = new OrdersController(queue, audit, NullLogger<OrdersController>.Instance);

        var result = sut.QueueStatus();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<OrderQueueStatusDto>().Subject;
        dto.PendingCount.Should().Be(3);
        dto.Queue.Should().NotBeNullOrWhiteSpace();
        dto.JobName.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Enqueue_returns_bad_request_when_order_id_missing()
    {
        var queue = Substitute.For<IOrderJobQueue>();
        var audit = Substitute.For<IAuditLogger>();
        var sut = new OrdersController(queue, audit, NullLogger<OrdersController>.Instance);

        var result = await sut.Enqueue(new EnqueueOrderRequest { OrderId = "  " }, CancellationToken.None);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        await queue.DidNotReceiveWithAnyArgs().EnqueueAsync(default!, default);
    }

    [Fact]
    public async Task Enqueue_accepts_job_and_audits()
    {
        var queue = Substitute.For<IOrderJobQueue>();
        var audit = Substitute.For<IAuditLogger>();
        queue.EnqueueAsync("ord-1", Arg.Any<CancellationToken>())
            .Returns(new ProcessOrderJob("job-1", "ord-1"));
        var sut = new OrdersController(queue, audit, NullLogger<OrdersController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.Role, "Admin")],
                        authenticationType: "test")),
                },
            },
        };

        var result = await sut.Enqueue(new EnqueueOrderRequest { OrderId = "ord-1" }, CancellationToken.None);

        var accepted = result.Result.Should().BeOfType<AcceptedResult>().Subject;
        var dto = accepted.Value.Should().BeOfType<EnqueueOrderResponse>().Subject;
        dto.Accepted.Should().BeTrue();
        dto.JobId.Should().Be("job-1");
        dto.OrderId.Should().Be("ord-1");
        audit.Received(1).StaffAction(
            Arg.Any<ClaimsPrincipal>(),
            "order.enqueue",
            "OrderJob",
            "job-1",
            Arg.Any<object?>());
    }
}
