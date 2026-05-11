namespace Kettan.Server.Services.Subscription;

public sealed record SubscriptionLimits(
    int? BranchLimit,
    int? UserLimit);

public interface ISubscriptionLimitService
{
    Task<SubscriptionLimits> GetTenantLimitsAsync(int tenantId, CancellationToken cancellationToken = default);
    Task EnsureCanCreateBranchAsync(int tenantId, CancellationToken cancellationToken = default);
    Task EnsureCanAssignActiveUserAsync(
        int tenantId,
        int? branchId,
        int? excludeUserId = null,
        CancellationToken cancellationToken = default);
}

