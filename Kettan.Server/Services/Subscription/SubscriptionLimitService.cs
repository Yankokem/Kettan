using Kettan.Server.Data;
using Kettan.Server.Entities;
using Kettan.Server.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Services.Subscription;

public class SubscriptionLimitService : ISubscriptionLimitService
{
    public const int DefaultUsersPerBranchLimit = 5;

    private readonly ApplicationDbContext _context;

    public SubscriptionLimitService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SubscriptionLimits> GetTenantLimitsAsync(int tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.CurrentSubscription)
            .ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && !t.IsDeleted, cancellationToken);

        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found.");
        }

        var plan = tenant.CurrentSubscription?.Plan;
        if (plan == null)
        {
            var planCode = tenant.SubscriptionTier switch
            {
                SubscriptionTier.Starter => "STARTER",
                SubscriptionTier.Growth => "GROWTH",
                SubscriptionTier.Enterprise => "ENTERPRISE",
                _ => "STARTER"
            };
            var tierName = tenant.SubscriptionTier.ToString();

            plan = await _context.SubscriptionPlans
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    p => p.IsActive
                         && !p.IsDeleted
                         && (p.PlanCode == planCode || p.Name == tierName),
                    cancellationToken);
        }

        return new SubscriptionLimits(
            plan?.BranchLimit,
            plan?.UserLimit,
            DefaultUsersPerBranchLimit);
    }

    public async Task EnsureCanCreateBranchAsync(int tenantId, CancellationToken cancellationToken = default)
    {
        var limits = await GetTenantLimitsAsync(tenantId, cancellationToken);
        if (!limits.BranchLimit.HasValue)
        {
            return;
        }

        var activeBranches = await _context.Branches
            .IgnoreQueryFilters()
            .CountAsync(
                b => b.TenantId == tenantId
                     && !b.IsDeleted
                     && b.IsActive,
                cancellationToken);

        if (activeBranches >= limits.BranchLimit.Value)
        {
            throw new InvalidOperationException(
                $"Branch limit reached. Your current plan allows up to {limits.BranchLimit.Value} active branches.");
        }
    }

    public async Task EnsureCanAssignActiveUserAsync(
        int tenantId,
        int? branchId,
        int? excludeUserId = null,
        CancellationToken cancellationToken = default)
    {
        var limits = await GetTenantLimitsAsync(tenantId, cancellationToken);

        if (limits.UserLimit.HasValue)
        {
            var activeUsersQuery = _context.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId == tenantId && !u.IsDeleted && u.IsActive);

            if (excludeUserId.HasValue)
            {
                activeUsersQuery = activeUsersQuery.Where(u => u.UserId != excludeUserId.Value);
            }

            var activeUsersCount = await activeUsersQuery.CountAsync(cancellationToken);
            if (activeUsersCount >= limits.UserLimit.Value)
            {
                throw new InvalidOperationException(
                    $"User limit reached. Your current plan allows up to {limits.UserLimit.Value} active users.");
            }
        }

        if (!branchId.HasValue)
        {
            return;
        }

        var branchExists = await _context.Branches
            .IgnoreQueryFilters()
            .AnyAsync(
                b => b.BranchId == branchId.Value
                     && b.TenantId == tenantId
                     && !b.IsDeleted
                     && b.IsActive,
                cancellationToken);

        if (!branchExists)
        {
            throw new InvalidOperationException("Selected branch is invalid or inactive.");
        }

        var branchUsersQuery = _context.Users
            .IgnoreQueryFilters()
            .Where(u =>
                u.TenantId == tenantId
                && u.BranchId == branchId.Value
                && !u.IsDeleted
                && u.IsActive);

        if (excludeUserId.HasValue)
        {
            branchUsersQuery = branchUsersQuery.Where(u => u.UserId != excludeUserId.Value);
        }

        var activeUsersInBranch = await branchUsersQuery.CountAsync(cancellationToken);
        if (activeUsersInBranch >= limits.UsersPerBranchLimit)
        {
            throw new InvalidOperationException(
                $"Per-branch user limit reached. A branch can only have {limits.UsersPerBranchLimit} active users.");
        }
    }
}

