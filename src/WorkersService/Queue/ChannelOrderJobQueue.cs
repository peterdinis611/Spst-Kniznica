using System.Threading.Channels;
using WorkersService.Jobs;

namespace WorkersService.Queue;

public sealed class ChannelOrderJobQueue : IOrderJobQueue
{
    private readonly Channel<ProcessOrderJob> _channel =
        Channel.CreateUnbounded<ProcessOrderJob>(new UnboundedChannelOptions
        {
            SingleReader = false,
            SingleWriter = false
        });

    public ValueTask<ProcessOrderJob> EnqueueAsync(
        string orderId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(orderId);

        var normalized = orderId.Trim();
        var job = new ProcessOrderJob($"order-{normalized}", normalized);
        if (!_channel.Writer.TryWrite(job))
        {
            throw new InvalidOperationException("Order job queue rejected the write.");
        }

        return ValueTask.FromResult(job);
    }

    public IAsyncEnumerable<ProcessOrderJob> ReadAllAsync(CancellationToken cancellationToken)
        => _channel.Reader.ReadAllAsync(cancellationToken);
}
