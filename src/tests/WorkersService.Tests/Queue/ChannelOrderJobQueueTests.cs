using FluentAssertions;
using WorkersService.Queue;

namespace WorkersService.Tests.Queue;

public class ChannelOrderJobQueueTests
{
    [Fact]
    public async Task EnqueueAsync_trims_order_id_and_builds_job_id()
    {
        var queue = new ChannelOrderJobQueue();

        var job = await queue.EnqueueAsync("  ORD-42  ");

        job.OrderId.Should().Be("ORD-42");
        job.JobId.Should().Be("order-ORD-42");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task EnqueueAsync_rejects_blank_order_id(string? orderId)
    {
        var queue = new ChannelOrderJobQueue();

        var act = async () => await queue.EnqueueAsync(orderId!);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task ReadAllAsync_yields_enqueued_jobs_in_order()
    {
        var queue = new ChannelOrderJobQueue();
        await queue.EnqueueAsync("one");
        await queue.EnqueueAsync("two");

        var jobs = new List<string>();
        await foreach (var job in queue.ReadAllAsync(CancellationToken.None))
        {
            jobs.Add(job.OrderId);
            if (jobs.Count == 2)
            {
                break;
            }
        }

        jobs.Should().Equal("one", "two");
    }
}
