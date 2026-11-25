using Microsoft.EntityFrameworkCore;

namespace EmailService.Data;

public static class EmailSchema
{
    public static async Task EnsureAsync(EmailDbContext db, CancellationToken cancellationToken = default)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                """ALTER TABLE "email_messages" ADD COLUMN "AttemptCount" INTEGER NOT NULL DEFAULT 0;""",
                cancellationToken);
        }
        catch
        {
            // Column already exists.
        }
    }
}