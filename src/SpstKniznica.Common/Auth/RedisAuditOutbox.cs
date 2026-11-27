using System.Text.Json;
using StackExchange.Redis;

namespace SpstKniznica.Common.Auth;

/// <summary>
/// Multi-host audit backlog backed by a Redis list (AOF recommended).
/// </summary>
public sealed class RedisAuditOutbox : IAuditOutbox
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IDatabase _db;
    private readonly string _key;

    public RedisAuditOutbox(IConnectionMultiplexer mux, string instanceKey = "spst:audit-outbox")
    {
        _db = mux.GetDatabase();
        _key = string.IsNullOrWhiteSpace(instanceKey) ? "spst:audit-outbox" : instanceKey.Trim();
    }

    public string Describe => $"redis:{_key}";

    public void Enqueue(AuditEntry entry)
    {
        var payload = JsonSerializer.Serialize(entry, JsonOptions);
        _db.ListLeftPush(_key, payload);
    }

    public IReadOnlyList<AuditEntry> DequeueBatch(int max)
    {
        if (max <= 0)
        {
            return [];
        }

        var batch = new List<AuditEntry>(Math.Min(max, 64));
        for (var i = 0; i < max; i++)
        {
            var value = _db.ListRightPop(_key);
            if (value.IsNullOrEmpty)
            {
                break;
            }

            try
            {
                var entry = JsonSerializer.Deserialize<AuditEntry>((string)value!, JsonOptions);
                if (entry is not null)
                {
                    batch.Add(entry);
                }
            }
            catch
            {
                // Drop corrupt payloads.
            }
        }

        return batch;
    }

    public void Requeue(IEnumerable<AuditEntry> entries)
    {
        foreach (var entry in entries)
        {
            Enqueue(entry);
        }
    }

    public int Count()
        => (int)Math.Min(int.MaxValue, _db.ListLength(_key));
}
