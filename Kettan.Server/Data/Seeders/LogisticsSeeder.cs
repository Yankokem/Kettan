using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class LogisticsSeeder
{
    public static async Task EnsureVehicleAsync(
        ApplicationDbContext context,
        Tenant tenant,
        CancellationToken cancellationToken)
    {
        var vehicle = await context.Set<Vehicle>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(v => v.TenantId == tenant.TenantId && v.PlateNumber == "NCR-1234", cancellationToken);

        if (vehicle is null)
        {
            vehicle = new Vehicle
            {
                TenantId = tenant.TenantId,
                PlateNumber = "NCR-1234",
                VehicleType = "Motorcycle",
                Description = "Primary branch delivery unit",
                IsActive = true
            };

            context.Set<Vehicle>().Add(vehicle);
        }
        else
        {
            vehicle.TenantId = tenant.TenantId;
            vehicle.PlateNumber = "NCR-1234";
            vehicle.VehicleType = "Motorcycle";
            vehicle.Description = "Primary branch delivery unit";
            vehicle.IsActive = true;
            vehicle.IsDeleted = false;
            vehicle.DeletedAt = null;
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}

