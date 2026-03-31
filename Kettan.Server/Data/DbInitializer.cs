using Microsoft.EntityFrameworkCore;
using Kettan.Server.Entities;

namespace Kettan.Server.Data;

public static class DbInitializer
{
    public static void Initialize(ApplicationDbContext context)
    {
        context.Database.EnsureCreated();

        // Check if database is already seeded (must ignore filters since HttpContext is null here)
        if (context.Set<Tenant>().IgnoreQueryFilters().Any())
        {
            return;
        }

        // Add a dummy tenant
        var dummyTenant = new Tenant
        {
            Name = "Dummy Corporation",
            SubscriptionTier = "Pro"
        };
        context.Set<Tenant>().Add(dummyTenant);
        context.SaveChanges();

        // Add a few branches
        var hqBranch = new Branch
        {
            TenantId = dummyTenant.TenantId,
            Name = "HQ Branch",
            Location = "Headquarters"
        };
        var branch1 = new Branch
        {
            TenantId = dummyTenant.TenantId,
            Name = "Main Branch",
            Location = "Downtown"
        };
        context.Set<Branch>().AddRange(hqBranch, branch1);
        context.SaveChanges();

        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("password123");

        var users = new List<User>
        {
            // 1. SuperAdmin (No Tenant - Platform level)
            new User
            {
                FirstName = "Super",
                LastName = "Admin",
                Email = "superadmin@kettan.local",
                PasswordHash = defaultPasswordHash,
                Role = "SuperAdmin",
                TenantId = null,
                BranchId = null
            },
            // 2. TenantAdmin (Assigned to Tenant, no specific branch)
            new User
            {
                TenantId = dummyTenant.TenantId,
                FirstName = "Tenant",
                LastName = "Admin",
                Email = "tenantadmin@dummycorp.local",
                PasswordHash = defaultPasswordHash,
                Role = "TenantAdmin",
                BranchId = null
            },
            // 3. HqManager (Assigned to Tenant and HQ)
            new User
            {
                TenantId = dummyTenant.TenantId,
                BranchId = hqBranch.BranchId,
                FirstName = "HQ",
                LastName = "Manager",
                Email = "hqmanager@dummycorp.local",
                PasswordHash = defaultPasswordHash,
                Role = "HqManager"
            },
            // 4. HqStaff (Assigned to Tenant and HQ)
            new User
            {
                TenantId = dummyTenant.TenantId,
                BranchId = hqBranch.BranchId,
                FirstName = "HQ",
                LastName = "Staff",
                Email = "hqstaff@dummycorp.local",
                PasswordHash = defaultPasswordHash,
                Role = "HqStaff"
            },
            // 5. BranchOwner (Assigned to Tenant and specific Branch)
            new User
            {
                TenantId = dummyTenant.TenantId,
                BranchId = branch1.BranchId,
                FirstName = "Branch",
                LastName = "Owner",
                Email = "owner_main@dummycorp.local",
                PasswordHash = defaultPasswordHash,
                Role = "BranchOwner"
            },
            // 6. BranchManager (Assigned to Tenant and specific Branch)
            new User
            {
                TenantId = dummyTenant.TenantId,
                BranchId = branch1.BranchId,
                FirstName = "Branch",
                LastName = "Manager",
                Email = "manager_main@dummycorp.local",
                PasswordHash = defaultPasswordHash,
                Role = "BranchManager"
            }
        };

        context.Set<User>().AddRange(users);
        context.SaveChanges();
    }
}