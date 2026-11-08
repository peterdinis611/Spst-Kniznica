namespace WorkersService.Jobs;

public sealed record ProcessOrderJob(string JobId, string OrderId);
