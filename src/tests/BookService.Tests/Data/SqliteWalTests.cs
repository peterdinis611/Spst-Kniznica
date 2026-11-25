using System.Globalization;
using BookService.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;

namespace BookService.Tests.Data;

public class SqliteWalTests
{
    [Fact]
    public async Task File_database_opens_in_wal_with_busy_timeout()
    {
        var path = Path.Combine(Path.GetTempPath(), $"spst-wal-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<BookDbContext>()
                .UseSqlite(SqliteConnectionDefaults.Apply($"Data Source={path}"))
                .AddInterceptors(new SqliteFoldConnectionInterceptor())
                .Options;

            await using (var db = new BookDbContext(options))
            {
                await db.Database.OpenConnectionAsync();
                var connection = db.Database.GetDbConnection();
                await using var command = connection.CreateCommand();
                command.CommandText = "PRAGMA journal_mode;";
                var mode = (await command.ExecuteScalarAsync())?.ToString();
                mode.Should().Be("wal");

                command.CommandText = "PRAGMA busy_timeout;";
                var timeout = Convert.ToInt32(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
                timeout.Should().Be(15000);

                command.CommandText = "PRAGMA synchronous;";
                var synchronous = Convert.ToInt32(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
                synchronous.Should().Be(1);
            }
        }
        finally
        {
            foreach (var suffix in new[] { "", "-wal", "-shm" })
            {
                var file = path + suffix;
                if (File.Exists(file))
                {
                    File.Delete(file);
                }
            }
        }
    }

    [Fact]
    public async Task Memory_database_stays_in_memory_journal()
    {
        var options = new DbContextOptionsBuilder<BookDbContext>()
            .UseSqlite("Data Source=:memory:")
            .AddInterceptors(new SqliteFoldConnectionInterceptor())
            .Options;

        await using var db = new BookDbContext(options);
        await db.Database.OpenConnectionAsync();
        var connection = db.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA journal_mode;";
        var mode = (await command.ExecuteScalarAsync())?.ToString();
        mode.Should().Be("memory");
    }
}
