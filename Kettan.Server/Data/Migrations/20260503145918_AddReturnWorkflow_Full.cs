using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnWorkflow_Full : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reason",
                table: "ReturnItems");

            migrationBuilder.AddColumn<DateTime>(
                name: "AcknowledgedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AcknowledgedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArrivedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ArrivedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompletedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DispatchedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DispatchedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InspectedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InspectingAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupLastUpdatedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupScheduledAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PickupVehicleId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RejectedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Returns",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Status",
                table: "Returns",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Returns",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubmittedBy_UserId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Disposition",
                table: "ReturnItems",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "InspectionRemarks",
                table: "ReturnItems",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityInspected",
                table: "ReturnItems",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "ReasonCode",
                table: "ReturnItems",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<int>(
                name: "RestockBatchId",
                table: "ReturnItems",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReturnMessages",
                columns: table => new
                {
                    MessageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    ReturnId = table.Column<int>(type: "int", nullable: false),
                    SenderUserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnMessages", x => x.MessageId);
                    table.ForeignKey(
                        name: "FK_ReturnMessages_Returns_ReturnId",
                        column: x => x.ReturnId,
                        principalTable: "Returns",
                        principalColumn: "ReturnId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnMessages_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnMessages_Users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Returns_AcknowledgedBy_UserId",
                table: "Returns",
                column: "AcknowledgedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ArrivedBy_UserId",
                table: "Returns",
                column: "ArrivedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_CompletedBy_UserId",
                table: "Returns",
                column: "CompletedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_DispatchedBy_UserId",
                table: "Returns",
                column: "DispatchedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_InspectedBy_UserId",
                table: "Returns",
                column: "InspectedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_PickupVehicleId",
                table: "Returns",
                column: "PickupVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_RejectedBy_UserId",
                table: "Returns",
                column: "RejectedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_SubmittedBy_UserId",
                table: "Returns",
                column: "SubmittedBy_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnItems_RestockBatchId",
                table: "ReturnItems",
                column: "RestockBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnMessages_ReturnId",
                table: "ReturnMessages",
                column: "ReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnMessages_SenderUserId",
                table: "ReturnMessages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnMessages_TenantId",
                table: "ReturnMessages",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReturnItems_Batches_RestockBatchId",
                table: "ReturnItems",
                column: "RestockBatchId",
                principalTable: "Batches",
                principalColumn: "BatchId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_AcknowledgedBy_UserId",
                table: "Returns",
                column: "AcknowledgedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_ArrivedBy_UserId",
                table: "Returns",
                column: "ArrivedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_CompletedBy_UserId",
                table: "Returns",
                column: "CompletedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_DispatchedBy_UserId",
                table: "Returns",
                column: "DispatchedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_InspectedBy_UserId",
                table: "Returns",
                column: "InspectedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_RejectedBy_UserId",
                table: "Returns",
                column: "RejectedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_SubmittedBy_UserId",
                table: "Returns",
                column: "SubmittedBy_UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Vehicles_PickupVehicleId",
                table: "Returns",
                column: "PickupVehicleId",
                principalTable: "Vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReturnItems_Batches_RestockBatchId",
                table: "ReturnItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_AcknowledgedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_ArrivedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_CompletedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_DispatchedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_InspectedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_RejectedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_SubmittedBy_UserId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Vehicles_PickupVehicleId",
                table: "Returns");

            migrationBuilder.DropTable(
                name: "ReturnMessages");

            migrationBuilder.DropIndex(
                name: "IX_Returns_AcknowledgedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_ArrivedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_CompletedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_DispatchedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_InspectedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_PickupVehicleId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_RejectedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_SubmittedBy_UserId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_ReturnItems_RestockBatchId",
                table: "ReturnItems");

            migrationBuilder.DropColumn(
                name: "AcknowledgedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "AcknowledgedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "ArrivedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "ArrivedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "CompletedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "DispatchedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "DispatchedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "InspectedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "InspectingAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "PickupLastUpdatedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "PickupScheduledAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "PickupVehicleId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "RejectedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "SubmittedBy_UserId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "Disposition",
                table: "ReturnItems");

            migrationBuilder.DropColumn(
                name: "InspectionRemarks",
                table: "ReturnItems");

            migrationBuilder.DropColumn(
                name: "QuantityInspected",
                table: "ReturnItems");

            migrationBuilder.DropColumn(
                name: "ReasonCode",
                table: "ReturnItems");

            migrationBuilder.DropColumn(
                name: "RestockBatchId",
                table: "ReturnItems");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "ReturnItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
