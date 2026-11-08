namespace MessagingService.Options;

public class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public bool Enabled { get; set; } = true;
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public string Exchange { get; set; } = "spst.library.events";
    public string Queue { get; set; } = "spst.library.messaging";
    public string RoutingKey { get; set; } = "library.#";
}
