using Kettan.Server.Entities;

namespace Kettan.Server.Data;

public static class DbInitializer
{
    public static void Initialize(ApplicationDbContext context)
    {
        context.Database.EnsureCreated();

        // Check if database is already seeded
        if (context.Set<Tenant>().Any())
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
        var branch1 = new Branch
        {
            TenantId = dummyTenant.TenantId,
            Name = "Main Branch",
            Location = "Downtown"
        };
        var branch2 = new Branch
        {
            TenantId = dummyTenant.TenantId,
            Name = "North Branch",
            Location = "Northside Mall"
        };
        context.Set<Branch>().AddRange(branch1, branch2);
        context.SaveChanges();

        // Add Superadmin (No Tenant)
        var superAdmin = new User
        {
            FirstName = "Super",
            LastName = "Admin",
            Email = "superadmin@kettan.local",
            PasswordHash = "hashedpassword_goes_here", // In a real scenario, use BCrypt or similar
            Role = "SuperAdmin"
        };

        // Add Tenant Admin (Assigned to Tenant, but no specific branch)
        var tenantAdmin = new User
        {
            TenantId = dummyTenant.TenantId,
            FirstName = "Tenant",
            LastName = "Admin",
            Email = "admin@dummycorp.local",
            PasswordHash = "hashedpassword_goes_here",
            Role = "TenantAdmin"
        };

        // Add Branch Manager (Assigned to Tenant and specific Branch)
        var branchManager = new User
        {
            TenantId = dummyTenant.TenantId,
            BranchId = branch1.BranchId,
            FirstName = "Branch",
            LastName = "Manager",
            Email = "manager_main@dummycorp.local",
            PasswordHash = "hashedpassword_goes_here",
            Role = "BranchManager"
        };

        context.Set<User>().AddRange(superAdmin, tenantAdmin, branchManager);
        context.SaveChanges();
    }
}