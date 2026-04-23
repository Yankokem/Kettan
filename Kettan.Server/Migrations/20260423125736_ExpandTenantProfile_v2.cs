using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Migrations
{
    /// <inheritdoc />
    public partial class ExpandTenantProfile_v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                table: "Tenants",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupportEmail",
                table: "Tenants",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxId",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Tenants",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LegalName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SupportEmail",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TaxId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Tenants");
        }
    }
}
