using Microsoft.EntityFrameworkCore;

namespace BookService.Data;

public static class BookIntegrationsSchema
{
    public static async Task EnsureAsync(BookDbContext db, CancellationToken cancellationToken = default)
    {
        if (!await ColumnExistsAsync(db, "Books", "CoverUrl", cancellationToken))
        {
            await db.Database.ExecuteSqlRawAsync(
                """ALTER TABLE "Books" ADD COLUMN "CoverUrl" TEXT NULL;""",
                cancellationToken);
        }

        // Some seed/import paths wrote GUID TEXT in uppercase; normalize so lookups match Guid.ToString().
        await db.Database.ExecuteSqlRawAsync(
            """
            UPDATE "Books" SET "Id" = lower("Id") WHERE "Id" != lower("Id");
            UPDATE "Books" SET "AuthorId" = lower("AuthorId") WHERE "AuthorId" IS NOT NULL AND "AuthorId" != lower("AuthorId");
            UPDATE "Books" SET "CategoryId" = lower("CategoryId") WHERE "CategoryId" IS NOT NULL AND "CategoryId" != lower("CategoryId");
            UPDATE "BookCopies" SET "Id" = lower("Id") WHERE "Id" != lower("Id");
            UPDATE "BookCopies" SET "BookId" = lower("BookId") WHERE "BookId" != lower("BookId");
            """,
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
