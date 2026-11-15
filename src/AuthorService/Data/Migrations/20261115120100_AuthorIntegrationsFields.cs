using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthorService.Data.Migrations;

/// <inheritdoc />
public partial class AuthorIntegrationsFields : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Columns are applied idempotently by AuthorIntegrationsSchema.EnsureAsync
        // (existing DBs may already have them).
        migrationBuilder.Sql("SELECT 1;");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
