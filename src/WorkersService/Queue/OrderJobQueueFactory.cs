using SpstKniznica.Common.Hosting;
using StackExchange.Redis;

namespace WorkersService.Queue;

public static class OrderJobQueueFactory
{
    public static IOrderJobQueue Create(
        IServiceProvider sp,
        IConfiguration configuration)
    {
        var loggerFactory = sp.GetRequiredService<ILoggerFactory>();
        var existing = sp.GetService<IConnectionMultiplexer>();
        if (existing is { IsConnected: true })
        {
            return new RedisOrderJobQueue(
                existing,
                loggerFactory.CreateLogger<RedisOrderJobQueue>());
        }

        var mux = SpstRedisConnector.TryConnect(
            configuration,
            loggerFactory.CreateLogger("WorkersService.OrderJobQueue"));
        if (mux is not null)
        {
            return new RedisOrderJobQueue(
                mux,
                loggerFactory.CreateLogger<RedisOrderJobQueue>());
        }

        var fileLogger = loggerFactory.CreateLogger<FileBackedOrderJobQueue>();
        fileLogger.LogWarning(
            "Order job queue falling back to file JSONL (single-host only)");
        return ActivatorUtilities.CreateInstance<FileBackedOrderJobQueue>(sp);
    }
}
