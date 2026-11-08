using WorkersService.Jobs;

namespace WorkersService.Queue;

public interface IOrderJobQueue
{
    ValueTask<ProcessOrderJob> EnqueueAsync(string orderId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<ProcessOrderJob> ReadAllAsync(CancellationToken cancellationToken);
}
