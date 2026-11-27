using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;

namespace BookService.Data;

public static class BookIntegrationsSchema
{
    public static async Task EnsureAsync(BookDbContext db, CancellationToken cancellationToken = default)
    {
        // PostgreSQL schema comes from EF migrations — skip SQLite PRAGMA patches.
        if (SqliteGuidNormalize.IsNpgsql(db))
        {
            return;
        }

        if (!await ColumnExistsAsync(db, "Books", "CoverUrl", cancellationToken))
        {
            await db.Database.ExecuteSqlRawAsync(
                """ALTER TABLE "Books" ADD COLUMN "CoverUrl" TEXT NULL;""",
                cancellationToken);
        }

        // Baselines mark every migration as applied without running it, so existing
        // databases need the column here as well as in the EF migration.
        if (!await ColumnExistsAsync(db, "BookCopies", "Version", cancellationToken))
        {
            await db.Database.ExecuteSqlRawAsync(
                """ALTER TABLE "BookCopies" ADD COLUMN "Version" INTEGER NOT NULL DEFAULT 0;""",
                cancellationToken);
        }

        await SqliteGuidNormalize.LowerGuidColumnsAsync(
            db,
            [
                ("Books", "Id"),
                ("Books", "AuthorId"),
                ("Books", "CategoryId"),
                ("BookCopies", "Id"),
                ("BookCopies", "BookId"),
            ],
            cancellationToken);
    }

    private static async Task<bool> ColumnExistsAsync(
        BookDbContext db,
        string table,
        string column,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = $"PRAGMA table_info(\"{table}\")";
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                if (string.Equals(reader.GetString(1), column, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }

        return false;
    }
}
