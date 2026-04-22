using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class UserAccountSeeder
{
    public static async Task<Dictionary<string, User>> EnsureUsersAsync(
        ApplicationDbContext context,
        Tenant tenant,
        BranchContext branches,
        string defaultPasswordHash,
        CancellationToken cancellationToken)
    {
        var seeds = new[]
        {
            new UserSeed(SeedConstants.SuperAdminEmail, "Super", "Admin", "SuperAdmin", null),
            new UserSeed(SeedConstants.TenantAdminEmail, "Tenant", "Admin", "TenantAdmin", null),
            new UserSeed(SeedConstants.HqManagerEmail, "HQ", "Manager", "HqManager", SeedConstants.HqBranchName),
            new UserSeed(SeedConstants.HqStaffEmail, "HQ", "Staff", "HqStaff", SeedConstants.HqBranchName),
            new UserSeed(SeedConstants.BranchOwnerEmail, "Branch", "Owner", "BranchOwner", SeedConstants.MainBranchName),
            new UserSeed(SeedConstants.BranchManagerEmail, "Branch", "Manager", "BranchManager", SeedConstants.MainBranchName)
        };

        var emails = seeds.Select(s => s.Email).ToList();

        var existingUsers = await context.Set<User>()
            .IgnoreQueryFilters()
            .Where(u => emails.Contains(u.Email))
            .ToListAsync(cancellationToken);

        var usersByEmail = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in seeds)
        {
            var user = existingUsers.FirstOrDefault(u => u.Email == seed.Email);
            var isSuperAdmin = seed.Role == "SuperAdmin";

            int? tenantId = isSuperAdmin ? null : tenant.TenantId;
            int? branchId = null;

            if (!isSuperAdmin && !string.IsNullOrWhiteSpace(seed.BranchName))
            {
                branchId = BranchSeeder.ResolveBranch(branches, seed.BranchName).BranchId;
            }

            if (user is null)
            {
                user = new User
                {
                    TenantId = tenantId,
                    BranchId = branchId,
                    FirstName = seed.FirstName,
                    LastName = seed.LastName,
                    Email = seed.Email,
                    PasswordHash = defaultPasswordHash,
                    Role = seed.Role,
                    IsActive = true
                };

                context.Set<User>().Add(user);
            }
            else
            {
                user.TenantId = tenantId;
                user.BranchId = branchId;
                user.FirstName = seed.FirstName;
                user.LastName = seed.LastName;
                user.Role = seed.Role;
                user.IsActive = true;
                user.IsDeleted = false;
                user.DeletedAt = null;

                if (string.IsNullOrWhiteSpace(user.PasswordHash))
                {
                    user.PasswordHash = defaultPasswordHash;
                }
            }

            usersByEmail[seed.Email] = user;
        }

        await context.SaveChangesAsync(cancellationToken);

        return usersByEmail;
    }

    public static async Task EnsureBranchLeadershipAsync(
        ApplicationDbContext context,
        BranchContext branches,
        Dictionary<string, User> usersByEmail,
        CancellationToken cancellationToken)
    {
        var owner = usersByEmail[SeedConstants.BranchOwnerEmail];
        var manager = usersByEmail[SeedConstants.BranchManagerEmail];
        var mainBranch = branches.Main;

        var hasChanges = false;

        if (mainBranch.OwnerUserId != owner.UserId)
        {
            mainBranch.OwnerUserId = owner.UserId;
            hasChanges = true;
        }

        if (mainBranch.ManagerUserId != manager.UserId)
        {
            mainBranch.ManagerUserId = manager.UserId;
            hasChanges = true;
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private sealed record UserSeed(
        string Email,
        string FirstName,
        string LastName,
        string Role,
        string? BranchName);
}
