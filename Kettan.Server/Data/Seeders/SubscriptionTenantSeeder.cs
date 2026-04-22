using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class SubscriptionTenantSeeder
{
    public static async Task<Dictionary<string, SubscriptionPlan>> EnsureSubscriptionPlansAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var seeds = new[]
        {
            new SubscriptionPlanSeed("STARTER", "Starter", 999m, 1, 5),
            new SubscriptionPlanSeed("GROWTH", "Growth", 2499m, 3, 15),
            new SubscriptionPlanSeed("ENTERPRISE", "Enterprise", 4999m, 10, 50)
        };

        var planCodes = seeds.Select(s => s.PlanCode).ToList();

        var existingPlans = await context.Set<SubscriptionPlan>()
            .IgnoreQueryFilters()
            .Where(p => planCodes.Contains(p.PlanCode))
            .ToListAsync(cancellationToken);

        var plansByCode = new Dictionary<string, SubscriptionPlan>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in seeds)
        {
            var plan = existingPlans.FirstOrDefault(p => p.PlanCode == seed.PlanCode);

            if (plan is null)
            {
                plan = new SubscriptionPlan
                {
                    PlanCode = seed.PlanCode,
                    Name = seed.Name,
                    PriceMonthly = seed.PriceMonthly,
                    BranchLimit = seed.BranchLimit,
                    UserLimit = seed.UserLimit,
                    IsActive = true
                };

                context.Set<SubscriptionPlan>().Add(plan);
            }
            else
            {
                plan.Name = seed.Name;
                plan.PriceMonthly = seed.PriceMonthly;
                plan.BranchLimit = seed.BranchLimit;
                plan.UserLimit = seed.UserLimit;
                plan.IsActive = true;
                plan.IsDeleted = false;
                plan.DeletedAt = null;
            }

            plansByCode[seed.PlanCode] = plan;
        }

        await context.SaveChangesAsync(cancellationToken);

        return plansByCode;
    }

    public static async Task<Tenant> EnsureTenantAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var tenant = await context.Set<Tenant>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Email == SeedConstants.DummyTenantEmail, cancellationToken)
            ?? await context.Set<Tenant>()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Name == SeedConstants.DummyTenantName, cancellationToken);

        if (tenant is null)
        {
            tenant = new Tenant
            {
                Name = SeedConstants.DummyTenantName,
                Email = SeedConstants.DummyTenantEmail,
                Phone = "+639171234567",
                Address = "123 Coffee Ave, Manila",
                LogoUrl = "https://example.com/dummycorp-logo.png",
                SubscriptionTier = "Growth",
                SubscriptionStatus = "Active",
                IsActive = true
            };

            context.Set<Tenant>().Add(tenant);
        }
        else
        {
            tenant.Name = SeedConstants.DummyTenantName;
            tenant.Email = SeedConstants.DummyTenantEmail;
            tenant.Phone = "+639171234567";
            tenant.Address = "123 Coffee Ave, Manila";
            tenant.LogoUrl = "https://example.com/dummycorp-logo.png";
            tenant.SubscriptionTier = "Growth";
            tenant.SubscriptionStatus = "Active";
            tenant.IsActive = true;
            tenant.IsDeleted = false;
            tenant.DeletedAt = null;
        }

        await context.SaveChangesAsync(cancellationToken);

        return tenant;
    }

    public static async Task<TenantSubscription> EnsureTenantSubscriptionAsync(
        ApplicationDbContext context,
        Tenant tenant,
        SubscriptionPlan growthPlan,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var subscription = await context.Set<TenantSubscription>()
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenant.TenantId && s.PlanId == growthPlan.PlanId && s.BillingCycle == "Monthly")
            .OrderByDescending(s => s.PeriodEnd)
            .FirstOrDefaultAsync(cancellationToken);

        if (subscription is null)
        {
            subscription = new TenantSubscription
            {
                TenantId = tenant.TenantId,
                PlanId = growthPlan.PlanId,
                Status = "Active",
                BillingCycle = "Monthly",
                StartDate = now,
                PeriodStart = now,
                PeriodEnd = now.AddMonths(1),
                AutoRenew = true
            };

            context.Set<TenantSubscription>().Add(subscription);
        }
        else
        {
            subscription.Status = "Active";
            subscription.BillingCycle = "Monthly";
            subscription.AutoRenew = true;
            subscription.IsDeleted = false;
            subscription.DeletedAt = null;
            subscription.UpdatedAt = now;

            if (subscription.PeriodStart == default)
            {
                subscription.PeriodStart = now;
            }

            if (subscription.PeriodEnd <= now)
            {
                subscription.PeriodEnd = now.AddMonths(1);
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        tenant.CurrentSubscriptionId = subscription.TenantSubscriptionId;
        tenant.SubscriptionTier = growthPlan.Name;
        tenant.SubscriptionStatus = subscription.Status;
        tenant.SubscriptionPeriodStart = subscription.PeriodStart;
        tenant.SubscriptionPeriodEnd = subscription.PeriodEnd;

        await context.SaveChangesAsync(cancellationToken);

        return subscription;
    }

    private sealed record SubscriptionPlanSeed(
        string PlanCode,
        string Name,
        decimal PriceMonthly,
        int BranchLimit,
        int UserLimit);
}
