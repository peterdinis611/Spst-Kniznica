using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingService.Data.Migrations
{
    /// <inheritdoc />
    public partial class LoanPolicyStore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoanPolicyStore",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DefaultLoanDays = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxActiveLoansPerReader = table.Column<int>(type: "INTEGER", nullable: false),
                    RenewExtraDays = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxRenewals = table.Column<int>(type: "INTEGER", nullable: false),
                    FreezeNewLoans = table.Column<bool>(type: "INTEGER", nullable: false),
                    SchoolYearEndUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    ReminderDaysBeforeDue = table.Column<int>(type: "INTEGER", nullable: false),
                    SkipNonSchoolDays = table.Column<bool>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanPolicyStore", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoanPolicyStore");
        }
    }
}
