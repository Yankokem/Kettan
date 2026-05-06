using Kettan.Server.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260506183600_SubscriptionLimitsAndTenantContactExpansion")]
    public partial class SubscriptionLimitsAndTenantContactExpansion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE [Tenants] SET [Name] = LEFT([Name], 120) WHERE [Name] IS NOT NULL AND LEN([Name]) > 120;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [LegalName] = LEFT([LegalName], 180) WHERE [LegalName] IS NOT NULL AND LEN([LegalName]) > 180;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [Email] = LEFT([Email], 254) WHERE [Email] IS NOT NULL AND LEN([Email]) > 254;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [SupportEmail] = LEFT([SupportEmail], 254) WHERE [SupportEmail] IS NOT NULL AND LEN([SupportEmail]) > 254;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [Phone] = LEFT([Phone], 20) WHERE [Phone] IS NOT NULL AND LEN([Phone]) > 20;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [TaxId] = LEFT([TaxId], 32) WHERE [TaxId] IS NOT NULL AND LEN([TaxId]) > 32;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [Website] = LEFT([Website], 255) WHERE [Website] IS NOT NULL AND LEN([Website]) > 255;");
            migrationBuilder.Sql("UPDATE [Users] SET [Email] = LEFT([Email], 254) WHERE [Email] IS NOT NULL AND LEN([Email]) > 254;");
            migrationBuilder.Sql("UPDATE [RegistrationOtps] SET [Email] = LEFT([Email], 254) WHERE [Email] IS NOT NULL AND LEN([Email]) > 254;");
            migrationBuilder.Sql("UPDATE [RegistrationVerificationSessions] SET [Email] = LEFT([Email], 254) WHERE [Email] IS NOT NULL AND LEN([Email]) > 254;");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Tenants",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "LegalName",
                table: "Tenants",
                type: "nvarchar(180)",
                maxLength: 180,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Tenants",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SupportEmail",
                table: "Tenants",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Tenants",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telephone",
                table: "Tenants",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.Sql("UPDATE [Tenants] SET [SupportEmail] = [Email] WHERE [SupportEmail] IS NULL AND [Email] IS NOT NULL;");
            migrationBuilder.Sql("UPDATE [Tenants] SET [LegalName] = [Name] WHERE [LegalName] IS NULL AND [Name] IS NOT NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "TaxId",
                table: "Tenants",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Website",
                table: "Tenants",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "RegistrationVerificationSessions",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "RegistrationOtps",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_Branches_TenantId_IsActive_IsDeleted",
                table: "Branches",
                columns: new[] { "TenantId", "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId_BranchId_IsActive_IsDeleted",
                table: "Users",
                columns: new[] { "TenantId", "BranchId", "IsActive", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Branches_TenantId_IsActive_IsDeleted",
                table: "Branches");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId_BranchId_IsActive_IsDeleted",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Telephone",
                table: "Tenants");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Tenants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(120)",
                oldMaxLength: 120);

            migrationBuilder.AlterColumn<string>(
                name: "LegalName",
                table: "Tenants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(180)",
                oldMaxLength: 180,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Tenants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SupportEmail",
                table: "Tenants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Tenants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TaxId",
                table: "Tenants",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Website",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(254)",
                oldMaxLength: 254);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "RegistrationVerificationSessions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(254)",
                oldMaxLength: 254);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "RegistrationOtps",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(254)",
                oldMaxLength: 254);
        }
    }
}

