using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeBranchIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BranchItemSettings_BranchId_ItemId",
                table: "BranchItemSettings");

            migrationBuilder.AlterColumn<int>(
                name: "BranchId",
                table: "BranchItemSettings",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_BranchItemSettings_BranchId_ItemId",
                table: "BranchItemSettings",
                columns: new[] { "BranchId", "ItemId" },
                unique: true,
                filter: "[BranchId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BranchItemSettings_BranchId_ItemId",
                table: "BranchItemSettings");

            migrationBuilder.AlterColumn<int>(
                name: "BranchId",
                table: "BranchItemSettings",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BranchItemSettings_BranchId_ItemId",
                table: "BranchItemSettings",
                columns: new[] { "BranchId", "ItemId" },
                unique: true);
        }
    }
}
