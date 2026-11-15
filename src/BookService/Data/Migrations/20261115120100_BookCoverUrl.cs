using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookService.Data.Migrations;

/// <inheritdoc />
public partial class BookCoverUrl : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // CoverUrl is applied idempotently by BookIntegrationsSchema.EnsureAsync
        // (existing DBs may already have it).
        migrationBuilder.Sql("SELECT 1;");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
