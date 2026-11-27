using Microsoft.EntityFrameworkCore;

namespace SpstKniznica.Common.Data;

public static class SqliteGuidNormalize
{
    /// <summary>
    /// Lowercase GUID TEXT columns in place (SQLite only). No-op on PostgreSQL (uuid columns).
    /// </summary>
    public static async Task LowerGuidColumnsAsync(
        DbContext db,
        IEnumerable<(string Table, string Column)> columns,
        CancellationToken cancellationToken = default)
    {
        if (!IsSqlite(db))
        {
            return;
        }

        foreach (var (table, column) in columns)
        {
            var sql =
                $"""
                UPDATE "{table}"
                SET "{column}" = lower("{column}")
                WHERE "{column}" IS NOT NULL AND "{column}" != lower("{column}");
                """;
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
    }

    public static bool IsSqlite(DbContext db)
        => db.Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true;

    public static bool IsNpgsql(DbContext db)
        => db.Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;
}
