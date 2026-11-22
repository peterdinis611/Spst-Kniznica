using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace SpstKniznica.Common.Data;

public static class SqliteConnectionDefaults
{
    public static string Apply(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        var builder = new SqliteConnectionStringBuilder(connectionString);
        if (IsMemory(builder.DataSource))
        {
            return builder.ToString();
        }

        builder.Cache = SqliteCacheMode.Shared;
        builder.Mode = SqliteOpenMode.ReadWriteCreate;
        builder.DefaultTimeout = 5;
        return builder.ToString();
    }

    public static bool IsMemory(string? dataSource)
    {
        if (string.IsNullOrWhiteSpace(dataSource))
        {
            return false;
        }

        return dataSource.Equals(":memory:", StringComparison.OrdinalIgnoreCase)
            || dataSource.Contains("mode=memory", StringComparison.OrdinalIgnoreCase);
    }

    public static DbContextOptionsBuilder UseSpstSqlite(
        this DbContextOptionsBuilder options,
        string? connectionString,
        string fallbackDataSource)
    {
        var raw = string.IsNullOrWhiteSpace(connectionString)
            ? $"Data Source={fallbackDataSource}"
            : connectionString;
        return options
            .UseSqlite(Apply(raw))
            .AddInterceptors(new SqliteFoldConnectionInterceptor());
    }
}
