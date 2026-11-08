namespace SpstKniznica.Caching;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public bool Enabled { get; set; } = true;
    public string ConnectionString { get; set; } = "localhost:6379";
    public string InstanceName { get; set; } = "spst:";
    public int DefaultTtlSeconds { get; set; } = 300;
}
