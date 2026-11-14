using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingService.Data.Migrations
{
    /// <inheritdoc />
    public partial class LibraryOpsWaitlistFavoritesRenewal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastReminderAt",
                table: "Bookings",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RenewalCount",
                table: "Bookings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OwnerEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    BookId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ListName = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Waitlist",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BookId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BorrowerName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    BorrowerEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Waitlist", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_OwnerEmail",
                table: "Favorites",
                column: "OwnerEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_OwnerEmail_BookId_ListName",
                table: "Favorites",
                columns: new[] { "OwnerEmail", "BookId", "ListName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Waitlist_BookId",
                table: "Waitlist",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlist_BookId_BorrowerEmail",
                table: "Waitlist",
                columns: new[] { "BookId", "BorrowerEmail" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Waitlist_BorrowerEmail",
                table: "Waitlist",
                column: "BorrowerEmail");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropTable(
                name: "Waitlist");

            migrationBuilder.DropColumn(
                name: "LastReminderAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RenewalCount",
                table: "Bookings");
        }
    }
}
