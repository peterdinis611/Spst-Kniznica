using WorkersService.Queue;

namespace WorkersService.Jobs;

public sealed class OrderProcessingHostedService(
    IOrderJobQueue queue,
    ILogger<OrderProcessingHostedService> logger) : BackgroundService
{
    public const string JobName = "process-order";
    public const string QueueName = "orders";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Orders worker listening on queue {Queue} (job {JobName})",
            QueueName,
            JobName);

        await foreach (var job in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAsync(job, stoppingToken);
                logger.LogInformation(
                    "Job {JobId} completed ({JobName}) for order {OrderId}",
                    job.JobId,
                    JobName,
                    job.OrderId);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Job {JobId} failed for order {OrderId}",
                    job.JobId,
                    job.OrderId);
            }
        }
    }

    private Task ProcessAsync(ProcessOrderJob job, CancellationToken cancellationToken)
    {
        // Reservation enqueue hook — lifecycle scanning runs in LoanLifecycleHostedService.
        // Keep this as an audit/ack path for newly created bookings.
        logger.LogInformation(
            "Acknowledged reservation job {JobId} for booking/order {OrderId}",
            job.JobId,
            job.OrderId);
        return Task.CompletedTask;
    }
}
