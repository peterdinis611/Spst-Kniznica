using Microsoft.EntityFrameworkCore;

namespace SpstKniznica.Common.Data;

public static class SqliteGuidNormalize
{
    /// <summary>
    /// Lowercase GUID TEXT columns in place (SQLite). Safe no-op when columns are already lowercase.
    /// </summary>
    public static async Task LowerGuidColumnsAsync(
        DbContext db,
        IEnumerable<(string Table, string Column)> columns,
        CancellationToken cancellationToken = default)
    {
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
}
