using FluentAssertions;
using Microsoft.Data.Sqlite;
using SpstKniznica.Common.Data;

namespace SpstKniznica.Common.Tests.Data;

public class SqliteConnectionDefaultsTests
{
    [Fact]
    public void File_connection_shares_cache_and_waits_for_writers()
    {
        var parsed = new SqliteConnectionStringBuilder(
            SqliteConnectionDefaults.Apply("Data Source=books.db"));

        parsed.DataSource.Should().Be("books.db");
        parsed.Cache.Should().Be(SqliteCacheMode.Shared);
        parsed.Mode.Should().Be(SqliteOpenMode.ReadWriteCreate);
        parsed.DefaultTimeout.Should().Be(5);
    }

    [Fact]
    public void Memory_connection_is_left_alone()
    {
        var original = new SqliteConnectionStringBuilder("Data Source=:memory:");
        var parsed = new SqliteConnectionStringBuilder(
            SqliteConnectionDefaults.Apply("Data Source=:memory:"));

        parsed.DataSource.Should().Be(":memory:");
        parsed.Cache.Should().Be(original.Cache);
        parsed.DefaultTimeout.Should().Be(original.DefaultTimeout);
    }
}
