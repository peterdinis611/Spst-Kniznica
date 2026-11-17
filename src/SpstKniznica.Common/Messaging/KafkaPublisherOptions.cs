namespace SpstKniznica.Common.Messaging;

public class KafkaPublisherOptions
{
    public const string SectionName = "Kafka";

    public bool Enabled { get; set; } = true;
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string ClientId { get; set; } = "spst-publisher";
    public string Topic { get; set; } = "spst.library.events";

    /// <summary>Optional HMAC secret for <c>x-spst-signature</c> Kafka header.</summary>
    public string? SigningSecret { get; set; }

    /// <summary>When true and SigningSecret is empty while Enabled, registration fails.</summary>
    public bool RequireSigning { get; set; }
}
