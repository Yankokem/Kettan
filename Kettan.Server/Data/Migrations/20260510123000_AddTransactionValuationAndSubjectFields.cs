using Kettan.Server.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260510123000_AddTransactionValuationAndSubjectFields")]
    public partial class AddTransactionValuationAndSubjectFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "SupplyRequests",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalApprovedValue",
                table: "SupplyRequests",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalFulfilledValue",
                table: "SupplyRequests",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalRequestedValue",
                table: "SupplyRequests",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitCostSnapshot",
                table: "SupplyRequestItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "Returns",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalLossValue",
                table: "Returns",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalReturnedValue",
                table: "Returns",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitCostSnapshot",
                table: "ReturnItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql(
                """
                UPDATE sri
                SET sri.UnitCostSnapshot = ISNULL(i.UnitCost, 0)
                FROM SupplyRequestItems AS sri
                LEFT JOIN Items AS i ON i.ItemId = sri.ItemId
                WHERE sri.UnitCostSnapshot = 0;
                """);

            migrationBuilder.Sql(
                """
                UPDATE sr
                SET
                    sr.TotalRequestedValue = ISNULL(x.TotalRequestedValue, 0),
                    sr.TotalApprovedValue = ISNULL(x.TotalApprovedValue, 0),
                    sr.TotalFulfilledValue = ISNULL(x.TotalFulfilledValue, 0)
                FROM SupplyRequests AS sr
                OUTER APPLY
                (
                    SELECT
                        SUM(sri.QuantityRequested * sri.UnitCostSnapshot) AS TotalRequestedValue,
                        SUM(ISNULL(sri.QuantityApproved, 0) * sri.UnitCostSnapshot) AS TotalApprovedValue,
                        SUM(
                            CASE
                                WHEN sri.IsRejectedDuringPicking = 1 THEN 0
                                ELSE ISNULL(sri.SendQuantity, ISNULL(sri.QuantityApproved, 0))
                            END * sri.UnitCostSnapshot
                        ) AS TotalFulfilledValue
                    FROM SupplyRequestItems AS sri
                    WHERE sri.RequestId = sr.RequestId
                ) AS x;
                """);

            migrationBuilder.Sql(
                """
                UPDATE ri
                SET ri.UnitCostSnapshot = ISNULL(i.UnitCost, 0)
                FROM ReturnItems AS ri
                LEFT JOIN Items AS i ON i.ItemId = ri.ItemId
                WHERE ri.UnitCostSnapshot = 0;
                """);

            migrationBuilder.Sql(
                """
                UPDATE r
                SET
                    r.TotalReturnedValue = ISNULL(x.TotalReturnedValue, 0),
                    r.TotalLossValue = ISNULL(x.TotalLossValue, 0)
                FROM Returns AS r
                OUTER APPLY
                (
                    SELECT
                        SUM(ri.QuantityReturned * ri.UnitCostSnapshot) AS TotalReturnedValue,
                        SUM(
                            CASE
                                WHEN ri.Disposition = 2 THEN ISNULL(ri.QuantityInspected, ri.QuantityReturned)
                                ELSE 0
                            END * ri.UnitCostSnapshot
                        ) AS TotalLossValue
                    FROM ReturnItems AS ri
                    WHERE ri.ReturnId = r.ReturnId
                ) AS x;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Subject",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "TotalApprovedValue",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "TotalFulfilledValue",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "TotalRequestedValue",
                table: "SupplyRequests");

            migrationBuilder.DropColumn(
                name: "UnitCostSnapshot",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "TotalLossValue",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "TotalReturnedValue",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "UnitCostSnapshot",
                table: "ReturnItems");
        }
    }
}
