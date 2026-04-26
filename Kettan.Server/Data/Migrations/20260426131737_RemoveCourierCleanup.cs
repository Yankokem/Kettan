using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCourierCleanup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Couriers_CourierId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Couriers_CourierId",
                table: "Vehicles");

            migrationBuilder.DropTable(
                name: "Couriers");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CourierId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_CourierId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "CourierId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "CourierAssignment",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "CourierId",
                table: "Shipments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CourierId",
                table: "Vehicles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CourierAssignment",
                table: "Shipments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourierId",
                table: "Shipments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Couriers",
                columns: table => new
                {
                    CourierId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    ContactNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Couriers", x => x.CourierId);
                    table.ForeignKey(
                        name: "FK_Couriers_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CourierId",
                table: "Vehicles",
                column: "CourierId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_CourierId",
                table: "Shipments",
                column: "CourierId");

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_TenantId",
                table: "Couriers",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Couriers_CourierId",
                table: "Shipments",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "CourierId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Couriers_CourierId",
                table: "Vehicles",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "CourierId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
