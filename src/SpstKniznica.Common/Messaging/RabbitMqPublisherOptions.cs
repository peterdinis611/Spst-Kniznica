namespace SpstKniznica.Common.Messaging;

public class RabbitMqPublisherOptions
{
    public const string SectionName = "RabbitMq";

    public bool Enabled { get; set; } = true;
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public string Exchange { get; set; } = "spst.library.events";
    /// <summary>Optional durable queue bound at publish time (declare + bind). Leave empty to only publish to the exchange.</summary>
    public string Queue { get; set; } = string.Empty;
    public string RoutingKey { get; set; } = "library.#";
    public string ClientName { get; set; } = "spst-publisher";

    /// <summary>
    /// Optional HMAC secret for <c>x-spst-signature</c> on published messages.
    /// When set, consumers should reject unsigned/invalid payloads.
    /// </summary>
    public string? SigningSecret { get; set; }

    /// <summary>
    /// When true and <see cref="SigningSecret"/> is empty while Enabled, startup should fail
    /// (Production). Local/dev leave false.
    /// </summary>
    public bool RequireSigning { get; set; }
}
