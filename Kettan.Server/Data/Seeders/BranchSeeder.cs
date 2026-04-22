using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class BranchSeeder
{
    public static async Task<BranchContext> EnsureBranchesAsync(
        ApplicationDbContext context,
        Tenant tenant,
        CancellationToken cancellationToken)
    {
        var seeds = new[]
        {
            new BranchSeed(SeedConstants.HqBranchName, "Headquarters", "123 Coffee Ave", "Manila", null, null),
            new BranchSeed(SeedConstants.MainBranchName, "Downtown", "Bonifacio High Street", "Taguig", new TimeOnly(8, 0), new TimeOnly(22, 0))
        };

        var branchNames = seeds.Select(s => s.Name).ToList();

        var existingBranches = await context.Set<Branch>()
            .IgnoreQueryFilters()
            .Where(b => b.TenantId == tenant.TenantId && branchNames.Contains(b.Name))
            .ToListAsync(cancellationToken);

        var branchesByName = new Dictionary<string, Branch>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in seeds)
        {
            var branch = existingBranches.FirstOrDefault(b => b.Name == seed.Name);

            if (branch is null)
            {
                branch = new Branch
                {
                    TenantId = tenant.TenantId,
                    Name = seed.Name,
                    Location = seed.Location,
                    Address = seed.Address,
                    City = seed.City,
                    OpenTime = seed.OpenTime,
                    CloseTime = seed.CloseTime,
                    IsActive = true
                };

                context.Set<Branch>().Add(branch);
            }
            else
            {
                branch.TenantId = tenant.TenantId;
                branch.Name = seed.Name;
                branch.Location = seed.Location;
                branch.Address = seed.Address;
                branch.City = seed.City;
                branch.OpenTime = seed.OpenTime;
                branch.CloseTime = seed.CloseTime;
                branch.IsActive = true;
                branch.IsDeleted = false;
                branch.DeletedAt = null;
            }

            branchesByName[seed.Name] = branch;
        }

        await context.SaveChangesAsync(cancellationToken);

        return new BranchContext
        {
            Hq = branchesByName[SeedConstants.HqBranchName],
            Main = branchesByName[SeedConstants.MainBranchName]
        };
    }

    public static Branch ResolveBranch(BranchContext branches, string branchName)
    {
        return branchName switch
        {
            var value when value == SeedConstants.HqBranchName => branches.Hq,
            var value when value == SeedConstants.MainBranchName => branches.Main,
            _ => throw new InvalidOperationException($"Unknown seeded branch name: {branchName}")
        };
    }

    private sealed record BranchSeed(
        string Name,
        string? Location,
        string? Address,
        string? City,
        TimeOnly? OpenTime,
        TimeOnly? CloseTime);
}
