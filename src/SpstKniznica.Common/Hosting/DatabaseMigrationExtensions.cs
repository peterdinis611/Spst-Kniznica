using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Hosting;

public static class DatabaseMigrationExtensions
{
    /// <summary>
    /// Safe defaults for automatic startup migrations.
    /// Call after <c>UseSqlite(...)</c> (or any relational provider).
    /// </summary>
    public static DbContextOptionsBuilder ConfigureSpstMigrations(
        this DbContextOptionsBuilder options)
    {
        options.ConfigureWarnings(warnings =>
            warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
        return options;
    }

    /// <summary>
    /// Applies pending EF Core migrations at startup (all SPST DB-backed services).
    /// If the database was previously created with EnsureCreated (no history table),
    /// baselines existing migrations so MigrateAsync can proceed.
    /// </summary>
    public static async Task MigrateSpstDatabaseAsync<TContext>(
        this IServiceProvider services,
        string serviceName,
        Func<TContext, CancellationToken, Task>? afterMigrate = null,
        CancellationToken cancellationToken = default)
        where TContext : DbContext
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);

        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<TContext>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger($"Spst.Migrations.{serviceName}");

        await EnsureMigrationBaselineAsync(db, serviceName, logger, cancellationToken);

        var pending = (await db.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();
        if (pending.Count > 0)
        {
            logger.LogInformation(
                "{Service}: applying {Count} migration(s): {Migrations}",
                serviceName,
                pending.Count,
                string.Join(", ", pending));
        }
        else
        {
            logger.LogInformation("{Service}: database is up to date", serviceName);
        }

        await db.Database.MigrateAsync(cancellationToken);

        if (afterMigrate is not null)
        {
            await afterMigrate(db, cancellationToken);
        }

        logger.LogInformation("{Service}: migrations applied", serviceName);
    }

    private static async Task EnsureMigrationBaselineAsync(
        DbContext db,
        string serviceName,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var creator = db.GetService<IRelationalDatabaseCreator>();
        if (!await creator.ExistsAsync(cancellationToken))
        {
            return;
        }

        var applied = (await db.Database.GetAppliedMigrationsAsync(cancellationToken)).ToList();
        if (applied.Count > 0)
        {
            return;
        }

        var all = db.Database.GetMigrations().ToList();
        if (all.Count == 0)
        {
            return;
        }

        // Database exists (e.g. EnsureCreated) but has no EF history — baseline all
        // known migrations so MigrateAsync does not try to recreate tables.
        logger.LogWarning(
            "{Service}: existing database without migration history — baselining {Count} migration(s)",
            serviceName,
            all.Count);

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                "ProductVersion" TEXT NOT NULL
            );
            """,
            cancellationToken);

        var productVersion = typeof(DbContext).Assembly.GetName().Version?.ToString(3) ?? "10.0.0";
        foreach (var migrationId in all)
        {
            await db.Database.ExecuteSqlRawAsync(
                """
                INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ({0}, {1});
                """,
                new object[] { migrationId, productVersion },
                cancellationToken);
        }
    }
}
