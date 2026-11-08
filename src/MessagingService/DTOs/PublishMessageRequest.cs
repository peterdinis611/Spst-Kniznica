namespace MessagingService.DTOs;

public class PublishMessageRequest
{
    public string Source { get; set; } = "MessagingService";
    public string Message { get; set; } = "ping";
    public string Target { get; set; } = "all"; // all | kafka | rabbitmq
}
