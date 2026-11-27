namespace SpstKniznica.Common.Auth;

/// <summary>
/// Durable backlog when Admin audit HTTP ingest is down.
/// Prefer Redis for multi-host; file JSONL is single-host only.
/// </summary>
public interface IAuditOutbox
{
    /// <summary>Human-readable sink location (Redis key or file path).</summary>
    string Describe { get; }

    void Enqueue(AuditEntry entry);

    /// <summary>Atomically take up to <paramref name="max"/> entries for processing.</summary>
    IReadOnlyList<AuditEntry> DequeueBatch(int max);

    /// <summary>Put failed entries back for a later drain cycle.</summary>
    void Requeue(IEnumerable<AuditEntry> entries);

    int Count();
}
