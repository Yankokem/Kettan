using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLogisticCosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AnnualDemand",
                table: "Items",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "HoldingCost",
                table: "Items",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SetupCost",
                table: "Items",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnnualDemand",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "HoldingCost",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "SetupCost",
                table: "Items");
        }
    }
}
