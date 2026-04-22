using Kettan.Server.Data.Seeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kettan.Server.Data;

public static class DbInitializer
{
    public static void Initialize(ApplicationDbContext context, ILogger? logger = null)
    {
        InitializeAsync(context, logger).GetAwaiter().GetResult();
    }

    public static async Task InitializeAsync(
        ApplicationDbContext context,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        logger?.LogInformation("DbSeeder: starting migration and seed process.");

        try
        {
            await context.Database.MigrateAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "DbSeeder: failed to apply migrations.");
            throw;
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var plans = await SubscriptionTenantSeeder.EnsureSubscriptionPlansAsync(context, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured subscription plans.");

            var tenant = await SubscriptionTenantSeeder.EnsureTenantAsync(context, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured dummy tenant.");

            await SubscriptionTenantSeeder.EnsureTenantSubscriptionAsync(context, tenant, plans["GROWTH"], cancellationToken);
            logger?.LogInformation("DbSeeder: ensured tenant subscription state.");

            var branches = await BranchSeeder.EnsureBranchesAsync(context, tenant, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured branches.");

            var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword(SeedConstants.DefaultSeedPassword);
            var users = await UserAccountSeeder.EnsureUsersAsync(context, tenant, branches, defaultPasswordHash, cancellationToken);
            await UserAccountSeeder.EnsureBranchLeadershipAsync(context, branches, users, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured users and branch leadership assignments.");

            var units = await InventorySeeder.EnsureUnitsAsync(context, tenant, cancellationToken);
            var inventoryCategories = await InventorySeeder.EnsureInventoryCategoriesAsync(context, tenant, cancellationToken);
            var itemCategories = await InventorySeeder.EnsureItemCategoriesAsync(context, tenant, cancellationToken);
            var items = await InventorySeeder.EnsureItemsAsync(context, tenant, units, inventoryCategories, itemCategories, cancellationToken);
            await InventorySeeder.EnsureBatchesAsync(context, tenant, items, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured inventory data.");

            await MenuSeeder.EnsureMenuAsync(context, tenant, items, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured menu data.");

            await EmployeeSeeder.EnsureEmployeesAsync(context, tenant, branches, cancellationToken);
            var courier = await LogisticsSeeder.EnsureCourierAsync(context, tenant, cancellationToken);
            await LogisticsSeeder.EnsureVehicleAsync(context, tenant, courier, cancellationToken);
            logger?.LogInformation("DbSeeder: ensured workforce and logistics data.");

            await transaction.CommitAsync(cancellationToken);

            logger?.LogWarning("DbSeeder: default development credentials were ensured for seeded users. Change seeded passwords if this environment is shared.");
            logger?.LogInformation("DbSeeder: seed process completed successfully.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger?.LogError(ex, "DbSeeder: seed process failed and was rolled back.");
            throw;
        }
    }
}
