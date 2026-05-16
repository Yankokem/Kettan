using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMfaDeviceTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "SupplyPushBatchId",
                table: "Orders");

            migrationBuilder.AddColumn<DateTime>(
                name: "OtpExpiry",
                table: "Users",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtpHash",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DeviceToken = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDevices_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_BranchId_OccurredAt",
                table: "AuditLogs",
                columns: new[] { "BranchId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_OccurredAt",
                table: "AuditLogs",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_TenantId_BranchId_OccurredAt",
                table: "AuditLogs",
                columns: new[] { "TenantId", "BranchId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_TenantId_OccurredAt",
                table: "AuditLogs",
                columns: new[] { "TenantId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId_OccurredAt",
                table: "AuditLogs",
                columns: new[] { "UserId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserDevices_DeviceToken",
                table: "UserDevices",
                column: "DeviceToken");

            migrationBuilder.CreateIndex(
                name: "IX_UserDevices_UserId",
                table: "UserDevices",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserDevices");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_BranchId_OccurredAt",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_OccurredAt",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_TenantId_BranchId_OccurredAt",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_TenantId_OccurredAt",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_UserId_OccurredAt",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "OtpExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OtpHash",
                table: "Users");

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
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    DispatchDate = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    DispatchWindow = table.Column<byte>(type: "tinyint", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Priority = table.Column<byte>(type: "tinyint", nullable: false),
                    RequestType = table.Column<byte>(type: "tinyint", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    TransactionCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
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
                    ItemId = table.Column<int>(type: "int", nullable: false),
                    SupplyPushBatchId = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
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
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

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
    }
}
