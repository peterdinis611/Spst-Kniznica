namespace MessagingService.Options;

public class KafkaOptions
{
    public const string SectionName = "Kafka";

    public bool Enabled { get; set; } = true;
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string ClientId { get; set; } = "messaging-service";
    public string GroupId { get; set; } = "messaging-service";
    public string Topic { get; set; } = "spst.library.events";
}
