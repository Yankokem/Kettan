using System;
using Kettan.Server.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260511161000_AddSupplyPushBatchSupport")]
    public partial class AddSupplyPushBatchSupport : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SupplyPushBatchId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SupplyPushBatches",
                columns: table => new
                {
                    SupplyPushBatchId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    TransactionCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    RequestType = table.Column<byte>(type: "tinyint", nullable: false),
                    Priority = table.Column<byte>(type: "tinyint", nullable: false),
                    DispatchWindow = table.Column<byte>(type: "tinyint", nullable: false),
                    DispatchDate = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplyPushBatches", x => x.SupplyPushBatchId);
                    table.ForeignKey(
                        name: "FK_SupplyPushBatches_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplyPushBatches_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SupplyPushBatchItems",
                columns: table => new
                {
                    SupplyPushBatchItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    SupplyPushBatchId = table.Column<int>(type: "int", nullable: false),
                    ItemId = table.Column<int>(type: "int", nullable: false),
                    QuantityRequested = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnitCostSnapshot = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplyPushBatchItems", x => x.SupplyPushBatchItemId);
                    table.ForeignKey(
                        name: "FK_SupplyPushBatchItems_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplyPushBatchItems_SupplyPushBatches_SupplyPushBatchId",
                        column: x => x.SupplyPushBatchId,
                        principalTable: "SupplyPushBatches",
                        principalColumn: "SupplyPushBatchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplyPushBatchItems_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SupplyPushBatchId",
                table: "Orders",
                column: "SupplyPushBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyPushBatches_CreatedByUserId",
                table: "SupplyPushBatches",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyPushBatches_TenantId_TransactionCode",
                table: "SupplyPushBatches",
                columns: new[] { "TenantId", "TransactionCode" },
                unique: true,
                filter: "[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyPushBatchItems_ItemId",
                table: "SupplyPushBatchItems",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyPushBatchItems_SupplyPushBatchId_ItemId",
                table: "SupplyPushBatchItems",
                columns: new[] { "SupplyPushBatchId", "ItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupplyPushBatchItems_TenantId",
                table: "SupplyPushBatchItems",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_SupplyPushBatches_SupplyPushBatchId",
                table: "Orders",
                column: "SupplyPushBatchId",
                principalTable: "SupplyPushBatches",
                principalColumn: "SupplyPushBatchId",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_SupplyPushBatches_SupplyPushBatchId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "SupplyPushBatchItems");

            migrationBuilder.DropTable(
                name: "SupplyPushBatches");

            migrationBuilder.DropIndex(
                name: "IX_Orders_SupplyPushBatchId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SupplyPushBatchId",
                table: "Orders");
        }
    }
}
