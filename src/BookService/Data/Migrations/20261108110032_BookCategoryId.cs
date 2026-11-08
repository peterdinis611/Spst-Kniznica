using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookService.Data.Migrations
{
    /// <inheritdoc />
    public partial class BookCategoryId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Books",
                newName: "CategoryName");

            migrationBuilder.RenameIndex(
                name: "IX_Books_Category",
                table: "Books",
                newName: "IX_Books_CategoryName");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Books",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Books_CategoryId",
                table: "Books",
                column: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Books_CategoryId",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Books");

            migrationBuilder.RenameColumn(
                name: "CategoryName",
                table: "Books",
                newName: "Category");

            migrationBuilder.RenameIndex(
                name: "IX_Books_CategoryName",
                table: "Books",
                newName: "IX_Books_Category");
        }
    }
}
