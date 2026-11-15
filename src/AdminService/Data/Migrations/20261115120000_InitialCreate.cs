using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdminService.Data.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AuditLogs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                OccurredAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                Action = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                EntityType = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                EntityId = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                ActorIdHash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                ActorEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                ActorName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                Roles = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                DetailsJson = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                SourceService = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditLogs", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_Action",
            table: "AuditLogs",
            column: "Action");

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_ActorEmail",
            table: "AuditLogs",
            column: "ActorEmail");

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_EntityType",
            table: "AuditLogs",
            column: "EntityType");

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_OccurredAt",
            table: "AuditLogs",
            column: "OccurredAt");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AuditLogs");
    }
}
