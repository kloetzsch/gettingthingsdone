using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "Tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Bestehende Aufgaben behalten die bisherige Anzeigereihenfolge (neueste zuerst).
            migrationBuilder.Sql("""
                UPDATE "Tasks" AS t
                SET "SortOrder" = ordered.rn
                FROM (
                    SELECT "Id", (ROW_NUMBER() OVER (ORDER BY "CreatedAt" DESC) - 1)::integer AS rn
                    FROM "Tasks"
                ) AS ordered
                WHERE t."Id" = ordered."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_SortOrder",
                table: "Tasks",
                column: "SortOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_SortOrder",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "Tasks");
        }
    }
}
