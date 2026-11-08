namespace WorkersService.DTOs;

public sealed class EnqueueOrderRequest
{
    public required string OrderId { get; set; }
}

public sealed class EnqueueOrderResponse
{
    public bool Accepted { get; init; }
    public string? JobId { get; init; }
    public required string OrderId { get; init; }
    public required string Queue { get; init; }
    public required string Name { get; init; }
}
