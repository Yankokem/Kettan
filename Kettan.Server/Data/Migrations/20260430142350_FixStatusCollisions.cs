using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kettan.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixStatusCollisions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Move Approved (1) to 2
            migrationBuilder.Sql("UPDATE SupplyRequests SET Status = 2 WHERE Status = 1 AND EXISTS (SELECT 1 FROM Orders WHERE RequestId = SupplyRequests.RequestId)");

            // Move PartiallyApproved (2) to 3
            migrationBuilder.Sql("UPDATE SupplyRequests SET Status = 3 WHERE Status = 2 AND EXISTS (SELECT 1 FROM Orders WHERE RequestId = SupplyRequests.RequestId)");

            // Move Rejected (2) to 4
            migrationBuilder.Sql("UPDATE SupplyRequests SET Status = 4 WHERE Status = 2 AND NOT EXISTS (SELECT 1 FROM Orders WHERE RequestId = SupplyRequests.RequestId)");
            
            // Move AutoDrafted (4) to 6
            migrationBuilder.Sql("UPDATE SupplyRequests SET Status = 6 WHERE Status = 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
