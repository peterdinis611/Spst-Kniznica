namespace SpstKniznica.Common.Data;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>
    /// <c>Sqlite</c> (default, local) or <c>PostgreSql</c>.
    /// </summary>
    public string Provider { get; set; } = "Sqlite";

    /// <summary>
    /// Used when <see cref="Provider"/> is PostgreSQL and
    /// <c>ConnectionStrings:DefaultConnection</c> is empty.
    /// Per-service <see cref="PostgresOptions.Database"/> stays in appsettings;
    /// Host/User/Password can come from shared .env.
    /// </summary>
    public PostgresOptions Postgres { get; set; } = new();

    public bool IsPostgreSql =>
        string.Equals(Provider, "PostgreSql", StringComparison.OrdinalIgnoreCase)
        || string.Equals(Provider, "Postgres", StringComparison.OrdinalIgnoreCase)
        || string.Equals(Provider, "Npgsql", StringComparison.OrdinalIgnoreCase);

    public bool IsSqlite => !IsPostgreSql;
}

public sealed class PostgresOptions
{
    public string Host { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 5432;
    public string Database { get; set; } = string.Empty;
    public string Username { get; set; } = "spst";
    public string Password { get; set; } = "spst";

    public string ToConnectionString()
    {
        if (string.IsNullOrWhiteSpace(Database))
        {
            throw new InvalidOperationException(
                "Database:Postgres:Database must be set for PostgreSQL (e.g. spst_booking).");
        }

        return $"Host={Host};Port={Port};Database={Database};Username={Username};Password={Password}";
    }
}
