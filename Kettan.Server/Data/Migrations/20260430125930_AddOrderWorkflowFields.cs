using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBranchChecked",
                table: "SupplyRequestItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPacked",
                table: "SupplyRequestItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPicked",
                table: "SupplyRequestItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRejectedDuringPicking",
                table: "SupplyRequestItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PickingRejectionReason",
                table: "SupplyRequestItems",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SendQuantity",
                table: "SupplyRequestItems",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArrivedAt",
                table: "Orders",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ArrivedConfirmedByUserId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Orders",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompletedByUserId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ArrivedConfirmedByUserId",
                table: "Orders",
                column: "ArrivedConfirmedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CompletedByUserId",
                table: "Orders",
                column: "CompletedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_ArrivedConfirmedByUserId",
                table: "Orders",
                column: "ArrivedConfirmedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_CompletedByUserId",
                table: "Orders",
                column: "CompletedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_ArrivedConfirmedByUserId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_CompletedByUserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ArrivedConfirmedByUserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CompletedByUserId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "IsBranchChecked",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "IsPacked",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "IsPicked",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "IsRejectedDuringPicking",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "PickingRejectionReason",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "SendQuantity",
                table: "SupplyRequestItems");

            migrationBuilder.DropColumn(
                name: "ArrivedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ArrivedConfirmedByUserId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CompletedByUserId",
                table: "Orders");
        }
    }
}
