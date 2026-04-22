using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class LogisticsSeeder
{
    public static async Task<Courier> EnsureCourierAsync(
        ApplicationDbContext context,
        Tenant tenant,
        CancellationToken cancellationToken)
    {
        var courier = await context.Set<Courier>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.TenantId == tenant.TenantId && c.Name == "QuickRoute Courier", cancellationToken);

        if (courier is null)
        {
            courier = new Courier
            {
                TenantId = tenant.TenantId,
                Name = "QuickRoute Courier",
                ContactNumber = "09170000005",
                IsActive = true
            };

            context.Set<Courier>().Add(courier);
        }
        else
        {
            courier.TenantId = tenant.TenantId;
            courier.Name = "QuickRoute Courier";
            courier.ContactNumber = "09170000005";
            courier.IsActive = true;
            courier.IsDeleted = false;
            courier.DeletedAt = null;
        }

        await context.SaveChangesAsync(cancellationToken);

        return courier;
    }

    public static async Task EnsureVehicleAsync(
        ApplicationDbContext context,
        Tenant tenant,
        Courier courier,
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
                CourierId = courier.CourierId,
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
            vehicle.CourierId = courier.CourierId;
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
