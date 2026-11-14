using Microsoft.EntityFrameworkCore;

namespace AuthorService.Data;

public static class AuthorIntegrationsSchema
{
    public static async Task EnsureAsync(AuthorDbContext db, CancellationToken cancellationToken = default)
    {
        await EnsureColumnAsync(db, "WikidataId", """ALTER TABLE "Authors" ADD COLUMN "WikidataId" TEXT NULL;""", cancellationToken);
        await EnsureColumnAsync(db, "ViafId", """ALTER TABLE "Authors" ADD COLUMN "ViafId" TEXT NULL;""", cancellationToken);
        await EnsureColumnAsync(db, "ProfileUrl", """ALTER TABLE "Authors" ADD COLUMN "ProfileUrl" TEXT NULL;""", cancellationToken);
    }

    private static async Task EnsureColumnAsync(
        AuthorDbContext db,
        string column,
        string alterSql,
        CancellationToken cancellationToken)
    {
        if (await ColumnExistsAsync(db, column, cancellationToken))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(alterSql, cancellationToken);
    }

    private static async Task<bool> ColumnExistsAsync(
        AuthorDbContext db,
        string column,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = """PRAGMA table_info("Authors")""";
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
