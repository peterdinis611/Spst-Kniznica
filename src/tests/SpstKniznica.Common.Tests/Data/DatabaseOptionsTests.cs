using FluentAssertions;
using Microsoft.Extensions.Configuration;
using SpstKniznica.Common.Data;

namespace SpstKniznica.Common.Tests.Data;

public class DatabaseOptionsTests
{
    [Theory]
    [InlineData("PostgreSql", true)]
    [InlineData("Postgres", true)]
    [InlineData("Npgsql", true)]
    [InlineData("Sqlite", false)]
    [InlineData("", false)]
    public void Provider_detection(string provider, bool expectPg)
    {
        var options = new DatabaseOptions { Provider = provider };
        options.IsPostgreSql.Should().Be(expectPg);
        options.IsSqlite.Should().Be(!expectPg);
    }

    [Fact]
    public void LooksLikeSqliteConnectionString_detects_data_source()
    {
        SpstDatabaseExtensions.LooksLikeSqliteConnectionString("Data Source=bookings.db")
            .Should().BeTrue();
        SpstDatabaseExtensions.LooksLikeSqliteConnectionString(
                "Host=127.0.0.1;Database=spst_booking;Username=spst;Password=spst")
            .Should().BeFalse();
    }

    [Fact]
    public void Postgres_ToConnectionString_requires_database()
    {
        var act = () => new PostgresOptions().ToConnectionString();
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Configuration_binds_database_section()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "PostgreSql",
                ["Database:Postgres:Database"] = "spst_booking",
                ["Database:Postgres:Host"] = "db",
            })
            .Build();

        var options = config.GetSpstDatabaseOptions();
        options.IsPostgreSql.Should().BeTrue();
        options.Postgres.Database.Should().Be("spst_booking");
        options.Postgres.Host.Should().Be("db");
        options.Postgres.ToConnectionString().Should().Contain("Database=spst_booking");
    }
}
