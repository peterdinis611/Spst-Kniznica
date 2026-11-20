using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Common.Auth;
using WorkersService.Controllers;
using WorkersService.DTOs;
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
}
