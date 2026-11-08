namespace SpstKniznica.Common.Messaging;

public class KafkaPublisherOptions
{
    public const string SectionName = "Kafka";

    public bool Enabled { get; set; } = true;
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string ClientId { get; set; } = "spst-publisher";
    public string Topic { get; set; } = "spst.library.events";
}
