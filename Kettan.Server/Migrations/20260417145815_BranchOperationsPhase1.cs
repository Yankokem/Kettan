using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Migrations
{
    /// <inheritdoc />
    public partial class BranchOperationsPhase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DispatchDate",
                table: "SupplyRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DispatchWindow",
                table: "SupplyRequests",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "SupplyRequests",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "SupplyRequests",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RequestType",
                table: "SupplyRequests",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "CreditAmount",
                table: "Returns",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrls",
                table: "Returns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "Returns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConsumptionLogs",
                columns: table => new
                {
                    ConsumptionLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: false),
                    LoggedBy_UserId = table.Column<int>(type: "int", nullable: false),
                    Method = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Shift = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    LogDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsumptionLogs", x => x.ConsumptionLogId);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogs_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "BranchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogs_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogs_Users_LoggedBy_UserId",
                        column: x => x.LoggedBy_UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuItems",
                columns: table => new
                {
                    MenuItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SellingPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.MenuItemId);
                    table.ForeignKey(
                        name: "FK_MenuItems_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ReferenceId = table.Column<int>(type: "int", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_Notifications_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrderStatusHistories",
                columns: table => new
                {
                    HistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ChangedBy_UserId = table.Column<int>(type: "int", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistories", x => x.HistoryId);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Users_ChangedBy_UserId",
                        column: x => x.ChangedBy_UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReturnItems",
                columns: table => new
                {
                    ReturnItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    ReturnId = table.Column<int>(type: "int", nullable: false),
                    ItemId = table.Column<int>(type: "int", nullable: false),
                    QuantityReturned = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnItems", x => x.ReturnItemId);
                    table.ForeignKey(
                        name: "FK_ReturnItems_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnItems_Returns_ReturnId",
                        column: x => x.ReturnId,
                        principalTable: "Returns",
                        principalColumn: "ReturnId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnItems_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConsumptionLogItems",
                columns: table => new
                {
                    ConsumptionLogItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    ConsumptionLogId = table.Column<int>(type: "int", nullable: false),
                    MenuItemId = table.Column<int>(type: "int", nullable: true),
                    ItemId = table.Column<int>(type: "int", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsumptionLogItems", x => x.ConsumptionLogItemId);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogItems_ConsumptionLogs_ConsumptionLogId",
                        column: x => x.ConsumptionLogId,
                        principalTable: "ConsumptionLogs",
                        principalColumn: "ConsumptionLogId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogItems_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogItems_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "MenuItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConsumptionLogItems_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemIngredients",
                columns: table => new
                {
                    MenuItemIngredientId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    ItemId = table.Column<int>(type: "int", nullable: false),
                    QuantityPerUnit = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemIngredients", x => x.MenuItemIngredientId);
                    table.ForeignKey(
                        name: "FK_MenuItemIngredients_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MenuItemIngredients_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "MenuItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MenuItemIngredients_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ReviewedBy_UserId",
                table: "Returns",
                column: "ReviewedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogItems_ConsumptionLogId",
                table: "ConsumptionLogItems",
                column: "ConsumptionLogId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogItems_ItemId",
                table: "ConsumptionLogItems",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogItems_MenuItemId",
                table: "ConsumptionLogItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogItems_TenantId",
                table: "ConsumptionLogItems",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogs_BranchId",
                table: "ConsumptionLogs",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogs_LoggedBy_UserId",
                table: "ConsumptionLogs",
                column: "LoggedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionLogs_TenantId",
                table: "ConsumptionLogs",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemIngredients_ItemId",
                table: "MenuItemIngredients",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemIngredients_MenuItemId",
                table: "MenuItemIngredients",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemIngredients_TenantId",
                table: "MenuItemIngredients",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_TenantId",
                table: "MenuItems",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_TenantId",
                table: "Notifications",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_ChangedBy_UserId",
                table: "OrderStatusHistories",
                column: "ChangedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId",
                table: "OrderStatusHistories",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_TenantId",
                table: "OrderStatusHistories",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnItems_ItemId",
                table: "ReturnItems",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnItems_ReturnId",
                table: "ReturnItems",
                column: "ReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnItems_TenantId",
                table: "ReturnItems",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_ReviewedBy_UserId",
                table: "Returns",
                column: "ReviewedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_ReviewedBy_UserId",
                table: "Returns");

            migrationBuilder.DropTable(
                name: "ConsumptionLogItems");

            migrationBuilder.DropTable(
                name: "MenuItemIngredients");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "OrderStatusHistories");

            migrationBuilder.DropTable(
                name: "ReturnItems");

            migrationBuilder.DropTable(
                name: "ConsumptionLogs");

            migrationBuilder.DropTable(
                name: "MenuItems");

            migrationBuilder.DropIndex(
                name: "IX_Returns_ReviewedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "DispatchDate",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "DispatchWindow",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "RequestType",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "CreditAmount",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "PhotoUrls",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "ReviewedBy_UserId",
                table: "Returns");
        }
    }
}
