using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace SpstKniznica.Common.Data;

public static class SpstDatabaseExtensions
{
    /// <summary>
    /// Configures EF Core for SQLite (default) or PostgreSQL based on <c>Database:Provider</c>.
    /// </summary>
    public static DbContextOptionsBuilder UseSpstDatabase(
        this DbContextOptionsBuilder options,
        IConfiguration configuration,
        string sqliteFallbackFile)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(sqliteFallbackFile);

        var dbOptions = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>()
            ?? new DatabaseOptions();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (dbOptions.IsPostgreSql)
        {
            if (string.IsNullOrWhiteSpace(connectionString) || LooksLikeSqliteConnectionString(connectionString))
            {
                connectionString = dbOptions.Postgres.ToConnectionString();
            }

            return options
                .UseNpgsql(connectionString, npgsql =>
                {
                    npgsql.MigrationsHistoryTable("__EFMigrationsHistory");
                })
                .AddInterceptors(new PostgresFoldConnectionInterceptor());
        }

        return options.UseSpstSqlite(connectionString, sqliteFallbackFile);
    }

    public static DatabaseOptions GetSpstDatabaseOptions(this IConfiguration configuration)
        => configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>()
           ?? new DatabaseOptions();

    public static bool LooksLikeSqliteConnectionString(string connectionString)
        => connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
           || connectionString.Contains("Filename=", StringComparison.OrdinalIgnoreCase);
}
