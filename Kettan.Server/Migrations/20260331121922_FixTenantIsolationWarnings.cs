using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixTenantIsolationWarnings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "SupplyRequestItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "OrderAllocations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_SupplyRequestItems_TenantId",
                table: "SupplyRequestItems",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAllocations_TenantId",
                table: "OrderAllocations",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderAllocations_Tenants_TenantId",
                table: "OrderAllocations",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SupplyRequestItems_Tenants_TenantId",
                table: "SupplyRequestItems",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderAllocations_Tenants_TenantId",
                table: "OrderAllocations");

            migrationBuilder.DropForeignKey(
                name: "FK_SupplyRequestItems_Tenants_TenantId",
                table: "SupplyRequestItems");

            migrationBuilder.DropIndex(
                name: "IX_SupplyRequestItems_TenantId",
                table: "SupplyRequestItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderAllocations_TenantId",
                table: "OrderAllocations");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "OrderAllocations");
        }
    }
}
