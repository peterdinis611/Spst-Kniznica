using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;

namespace BookingService.Data;

/// <summary>
/// Idempotent SQLite schema patches when a full EF migration has not been applied yet.
/// </summary>
public static class LibraryOpsSchema
{
    public static async Task EnsureAsync(BookingDbContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "Waitlist" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Waitlist" PRIMARY KEY,
                "BookId" TEXT NOT NULL,
                "BorrowerName" TEXT NOT NULL,
                "BorrowerEmail" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                "Notes" TEXT NULL
            );
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Waitlist_BookId_BorrowerEmail"
            ON "Waitlist" ("BookId", "BorrowerEmail");
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS "IX_Waitlist_BookId" ON "Waitlist" ("BookId");
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS "IX_Waitlist_BorrowerEmail" ON "Waitlist" ("BorrowerEmail");
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "Favorites" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Favorites" PRIMARY KEY,
                "OwnerEmail" TEXT NOT NULL,
                "BookId" TEXT NOT NULL,
                "ListName" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL
            );
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Favorites_OwnerEmail_BookId_ListName"
            ON "Favorites" ("OwnerEmail", "BookId", "ListName");
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS "IX_Favorites_OwnerEmail" ON "Favorites" ("OwnerEmail");
            """,
            cancellationToken);

        // Additive columns on Bookings (SQLite ignores duplicate ADD COLUMN errors via probe).
        await TryAddColumnAsync(
            db,
            """ALTER TABLE "Bookings" ADD COLUMN "RenewalCount" INTEGER NOT NULL DEFAULT 0;""",
            cancellationToken);
        await TryAddColumnAsync(
            db,
            """ALTER TABLE "Bookings" ADD COLUMN "LastReminderAt" TEXT NULL;""",
            cancellationToken);

        // One open reservation/loan per copy. Skip if legacy duplicates still exist.
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Bookings_BookCopyId_Active"
                ON "Bookings" ("BookCopyId")
                WHERE "BookCopyId" IS NOT NULL
                  AND "Status" IN ('Reserved', 'Active', 'Overdue');
                """,
                cancellationToken);
        }
        catch
        {
            // Duplicate active rows for the same copy — resolve manually, then restart.
        }

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "OutboxMessages" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_OutboxMessages" PRIMARY KEY,
                "EventType" TEXT NOT NULL,
                "Payload" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                "ProcessedAt" TEXT NULL,
                "AttemptCount" INTEGER NOT NULL DEFAULT 0,
                "LastError" TEXT NULL
            );
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS "IX_OutboxMessages_ProcessedAt"
            ON "OutboxMessages" ("ProcessedAt");
            """,
            cancellationToken);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS "IX_OutboxMessages_CreatedAt"
            ON "OutboxMessages" ("CreatedAt");
            """,
            cancellationToken);

        await SqliteGuidNormalize.LowerGuidColumnsAsync(
            db,
            [
                ("Bookings", "Id"),
                ("Bookings", "BookId"),
                ("Bookings", "BookCopyId"),
                ("Waitlist", "Id"),
                ("Waitlist", "BookId"),
                ("Favorites", "Id"),
                ("Favorites", "BookId"),
            ],
            cancellationToken);
    }

    private static async Task TryAddColumnAsync(
        BookingDbContext db,
        string sql,
        CancellationToken cancellationToken)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
        catch
        {
            // Column already exists.
        }
    }
}
