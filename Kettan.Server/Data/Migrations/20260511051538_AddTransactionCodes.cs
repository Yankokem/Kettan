using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SupplyRequests_TenantId",
                table: "SupplyRequests");

            migrationBuilder.DropIndex(
                name: "IX_Returns_TenantId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Orders_TenantId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_InventoryTransactions_TenantId",
                table: "InventoryTransactions");

            migrationBuilder.DropColumn(
                name: "PriceYearly",
                table: "SubscriptionPlans");

            migrationBuilder.AddColumn<string>(
                name: "TransactionCode",
                table: "SupplyRequests",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransactionCode",
                table: "Returns",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransactionCode",
                table: "Orders",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransactionCode",
                table: "InventoryTransactions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DocumentSequences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PeriodKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LastValue = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentSequences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SupplyRequests_TenantId_TransactionCode",
                table: "SupplyRequests",
                columns: new[] { "TenantId", "TransactionCode" },
                unique: true,
                filter: "[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_TenantId_TransactionCode",
                table: "Returns",
                columns: new[] { "TenantId", "TransactionCode" },
                unique: true,
                filter: "[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TenantId_TransactionCode",
                table: "Orders",
                columns: new[] { "TenantId", "TransactionCode" },
                unique: true,
                filter: "[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_TenantId_TransactionCode",
                table: "InventoryTransactions",
                columns: new[] { "TenantId", "TransactionCode" },
                unique: true,
                filter: "[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSequences_TenantId_DocumentType_PeriodKey",
                table: "DocumentSequences",
                columns: new[] { "TenantId", "DocumentType", "PeriodKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentSequences");

            migrationBuilder.DropIndex(
                name: "IX_SupplyRequests_TenantId_TransactionCode",
                table: "SupplyRequests");

            migrationBuilder.DropIndex(
                name: "IX_Returns_TenantId_TransactionCode",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Orders_TenantId_TransactionCode",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_InventoryTransactions_TenantId_TransactionCode",
                table: "InventoryTransactions");

            migrationBuilder.DropColumn(
                name: "TransactionCode",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "TransactionCode",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "TransactionCode",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "TransactionCode",
                table: "InventoryTransactions");

            migrationBuilder.AddColumn<decimal>(
                name: "PriceYearly",
                table: "SubscriptionPlans",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupplyRequests_TenantId",
                table: "SupplyRequests",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_TenantId",
                table: "Returns",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TenantId",
                table: "Orders",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_TenantId",
                table: "InventoryTransactions",
                column: "TenantId");
        }
    }
}
