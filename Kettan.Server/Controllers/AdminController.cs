using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── Dashboard KPIs ──────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var totalTenants = await _context.Tenants.IgnoreQueryFilters().CountAsync(ct);
        var activeTenants = await _context.Tenants.IgnoreQueryFilters()
            .CountAsync(t => t.IsActive && t.SubscriptionStatus == "Active", ct);
        var pendingPaymentTenants = await _context.Tenants.IgnoreQueryFilters()
            .CountAsync(t => t.SubscriptionStatus == "PendingPayment", ct);

        var totalBranches = await _context.Branches.IgnoreQueryFilters().CountAsync(ct);
        var totalUsers = await _context.Users.IgnoreQueryFilters()
            .CountAsync(u => u.Role != "SuperAdmin", ct);

        // MRR = sum of monthly prices for all active subscriptions
        var mrr = await _context.TenantSubscriptions.IgnoreQueryFilters()
            .Where(ts => ts.Status == "Active")
            .Join(_context.SubscriptionPlans, ts => ts.PlanId, p => p.PlanId, (ts, p) => p.PriceMonthly)
            .SumAsync(price => price, ct);

        // Plan distribution
        var planDistribution = await _context.TenantSubscriptions.IgnoreQueryFilters()
            .Where(ts => ts.Status == "Active")
            .Join(_context.SubscriptionPlans, ts => ts.PlanId, p => p.PlanId, (ts, p) => p)
            .GroupBy(p => p.Name)
            .Select(g => new
            {
                PlanName = g.Key,
                Count = g.Count(),
                Revenue = g.Sum(p => p.PriceMonthly)
            })
            .ToListAsync(ct);

        // Recent signups (last 5 tenants)
        var recentSignups = await _context.Tenants.IgnoreQueryFilters()
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new
            {
                t.TenantId,
                t.Name,
                t.SubscriptionTier,
                t.SubscriptionStatus,
                t.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new
        {
            totalTenants,
            activeTenants,
            pendingPaymentTenants,
            totalBranches,
            totalUsers,
            monthlyRecurringRevenue = mrr,
            planDistribution,
            recentSignups
        });
    }

    // ── Tenant List ─────────────────────────────────────────────────────────

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(
        [FromQuery] string? search,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = _context.Tenants.IgnoreQueryFilters().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(q) ||
                (t.Email != null && t.Email.ToLower().Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.SubscriptionStatus == status);
        }

        var tenants = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.TenantId,
                t.Name,
                t.Email,
                t.SubscriptionTier,
                t.SubscriptionStatus,
                t.IsActive,
                t.CreatedAt,
                BranchCount = _context.Branches.IgnoreQueryFilters().Count(b => b.TenantId == t.TenantId),
                UserCount = _context.Users.IgnoreQueryFilters().Count(u => u.TenantId == t.TenantId)
            })
            .ToListAsync(ct);

        return Ok(tenants);
    }

    // ── Tenant Detail ───────────────────────────────────────────────────────

    [HttpGet("tenants/{id:int}")]
    public async Task<IActionResult> GetTenantDetail(int id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.TenantId == id, ct);

        if (tenant == null) return NotFound(new { message = "Tenant not found." });

        var branches = await _context.Branches.IgnoreQueryFilters()
            .Where(b => b.TenantId == id)
            .Select(b => new { b.BranchId, b.Name, b.City, b.IsActive })
            .ToListAsync(ct);

        var userCount = await _context.Users.IgnoreQueryFilters()
            .CountAsync(u => u.TenantId == id, ct);

        var subscription = await _context.TenantSubscriptions.IgnoreQueryFilters()
            .Where(ts => ts.TenantId == id)
            .OrderByDescending(ts => ts.StartDate)
            .Select(ts => new
            {
                ts.TenantSubscriptionId,
                ts.Status,
                ts.BillingCycle,
                ts.StartDate,
                ts.PeriodStart,
                ts.PeriodEnd,
                ts.AutoRenew,
                PlanName = _context.SubscriptionPlans
                    .Where(p => p.PlanId == ts.PlanId)
                    .Select(p => p.Name)
                    .FirstOrDefault(),
                PlanPrice = _context.SubscriptionPlans
                    .Where(p => p.PlanId == ts.PlanId)
                    .Select(p => p.PriceMonthly)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);

        var payments = await _context.SubscriptionPayments.IgnoreQueryFilters()
            .Join(_context.SubscriptionInvoices.IgnoreQueryFilters(),
                p => p.InvoiceId, i => i.InvoiceId,
                (p, i) => new { Payment = p, Invoice = i })
            .Where(x => _context.TenantSubscriptions.IgnoreQueryFilters()
                    .Any(ts => ts.TenantSubscriptionId == x.Invoice.TenantSubscriptionId && ts.TenantId == id))
            .Select(x => new
            {
                x.Payment.PaymentId,
                x.Payment.Amount,
                x.Payment.Currency,
                x.Payment.PaymentMethod,
                x.Payment.Status,
                x.Payment.PaidAt
            })
            .OrderByDescending(x => x.PaidAt)
            .Take(10)
            .ToListAsync(ct);

        return Ok(new
        {
            tenant = new
            {
                tenant.TenantId,
                tenant.Name,
                tenant.Email,
                tenant.Phone,
                tenant.Address,
                tenant.SubscriptionTier,
                tenant.SubscriptionStatus,
                tenant.IsActive,
                tenant.CreatedAt
            },
            branches,
            userCount,
            subscription,
            payments
        });
    }

    // ── Deactivate Tenant ───────────────────────────────────────────────────

    [HttpPut("tenants/{id:int}/deactivate")]
    public async Task<IActionResult> DeactivateTenant(int id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.TenantId == id, ct);

        if (tenant == null) return NotFound(new { message = "Tenant not found." });

        tenant.IsActive = false;
        tenant.SubscriptionStatus = "Suspended";

        await _context.SaveChangesAsync(ct);

        return Ok(new { message = $"Tenant '{tenant.Name}' has been deactivated." });
    }

    // ── Activate Tenant ─────────────────────────────────────────────────────

    [HttpPut("tenants/{id:int}/activate")]
    public async Task<IActionResult> ActivateTenant(int id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.TenantId == id, ct);

        if (tenant == null) return NotFound(new { message = "Tenant not found." });

        tenant.IsActive = true;
        tenant.SubscriptionStatus = "Active";

        await _context.SaveChangesAsync(ct);

        return Ok(new { message = $"Tenant '{tenant.Name}' has been activated." });
    }

    // ── Platform Analytics ──────────────────────────────────────────────────

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Monthly revenue trend (last 6 months)
        var sixMonthsAgo = now.AddMonths(-6);
        var revenueTrend = await _context.SubscriptionPayments.IgnoreQueryFilters()
            .Where(p => p.PaidAt != null && p.PaidAt >= sixMonthsAgo && p.Status == "Paid")
            .GroupBy(p => new { p.PaidAt!.Value.Year, p.PaidAt!.Value.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(p => p.Amount)
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync(ct);

        // Tenant growth trend (new signups per month, last 6 months)
        var tenantGrowth = await _context.Tenants.IgnoreQueryFilters()
            .Where(t => t.CreatedAt >= sixMonthsAgo)
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync(ct);

        // Plan distribution
        var planDistribution = await _context.TenantSubscriptions.IgnoreQueryFilters()
            .Where(ts => ts.Status == "Active")
            .Join(_context.SubscriptionPlans, ts => ts.PlanId, p => p.PlanId, (ts, p) => p)
            .GroupBy(p => p.Name)
            .Select(g => new
            {
                PlanName = g.Key,
                Count = g.Count(),
                Revenue = g.Sum(p => p.PriceMonthly)
            })
            .ToListAsync(ct);

        // Top tenants by branch count
        var topTenants = await _context.Tenants.IgnoreQueryFilters()
            .Where(t => t.IsActive)
            .Select(t => new
            {
                t.TenantId,
                t.Name,
                t.SubscriptionTier,
                BranchCount = _context.Branches.IgnoreQueryFilters().Count(b => b.TenantId == t.TenantId)
            })
            .OrderByDescending(t => t.BranchCount)
            .Take(10)
            .ToListAsync(ct);

        // Total all-time revenue
        var totalRevenue = await _context.SubscriptionPayments.IgnoreQueryFilters()
            .Where(p => p.Status == "Paid")
            .SumAsync(p => p.Amount, ct);

        // New tenants this month
        var firstOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var newThisMonth = await _context.Tenants.IgnoreQueryFilters()
            .CountAsync(t => t.CreatedAt >= firstOfMonth, ct);

        return Ok(new
        {
            revenueTrend,
            tenantGrowth,
            planDistribution,
            topTenants,
            totalRevenue,
            newThisMonth
        });
    }
}
