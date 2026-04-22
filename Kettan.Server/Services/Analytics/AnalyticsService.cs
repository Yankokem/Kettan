using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Analytics;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AnalyticsService(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<EoqResultDto> CalculateEOQAsync(int itemId)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Tenant context required.");
        }

        var item = await _context.Items.FindAsync(itemId);
        if (item == null || item.TenantId != _currentUser.TenantId.Value)
        {
            throw new InvalidOperationException("Item not found.");
        }

        decimal annualDemand = item.AnnualDemand;

        if (annualDemand <= 0)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var recentConsumption = await _context.ConsumptionLogItems
                .Where(i => i.ItemId == itemId && i.TenantId == _currentUser.TenantId.Value && i.ConsumptionLog != null && i.ConsumptionLog.LogDate >= thirtyDaysAgo)
                .SumAsync(i => i.Quantity);
            
            annualDemand = recentConsumption * 12;
        }

        if (annualDemand <= 0 || item.HoldingCost <= 0 || item.SetupCost <= 0)
        {
            return new EoqResultDto
            {
                ItemId = itemId,
                ItemName = item.Name,
                EconomicOrderQuantity = 0,
                AnnualDemandUsed = annualDemand
            };
        }

        var eoq = (decimal)Math.Sqrt((double)((2 * annualDemand * item.SetupCost) / item.HoldingCost));

        return new EoqResultDto
        {
            ItemId = itemId,
            ItemName = item.Name,
            EconomicOrderQuantity = Math.Round(eoq, 2),
            AnnualDemandUsed = annualDemand
        };
    }

    public async Task<List<BranchScorecardDto>> CalculateBranchScoresAsync(DateTime startDate, DateTime endDate)
    {
        if (!_currentUser.TenantId.HasValue) return [];

        var tenantId = _currentUser.TenantId.Value;
        var branches = await _context.Branches.Where(b => b.TenantId == tenantId && b.IsActive).ToListAsync();
        var scorecards = new List<BranchScorecardDto>();

        var consumptions = await _context.ConsumptionLogs
            .Where(c => c.TenantId == tenantId && c.Method == "Sales" && c.LogDate >= startDate && c.LogDate <= endDate)
            .GroupBy(c => c.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count);

        var returns = await _context.Returns
            .Where(r => r.TenantId == tenantId && r.LoggedAt >= startDate && r.LoggedAt <= endDate)
            .GroupBy(r => r.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count);

        var requests = await _context.SupplyRequests
            .Where(s => s.TenantId == tenantId && s.CreatedAt >= startDate && s.CreatedAt <= endDate)
            .GroupBy(s => s.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count);

        int maxSales = consumptions.Values.DefaultIfEmpty(0).Max();

        foreach (var branch in branches)
        {
            int salesScore = consumptions.TryGetValue(branch.BranchId, out var s) ? s : 0;
            int returnScore = returns.TryGetValue(branch.BranchId, out var r) ? r : 0;
            int reqCount = requests.TryGetValue(branch.BranchId, out var req) ? req : 0;

            decimal baseScore = maxSales > 0 ? ((decimal)salesScore / maxSales) * 100m : 50m;
            decimal penalty = returnScore * 10m;
            decimal finalScore = Math.Clamp(baseScore - penalty, 0, 100);

            scorecards.Add(new BranchScorecardDto
            {
                BranchId = branch.BranchId,
                BranchName = branch.Name,
                ScorePercentage = Math.Round(finalScore, 1),
                SalesVolume = salesScore,
                ReturnsCount = returnScore,
                SupplyRequestsCount = reqCount
            });
        }

        return scorecards.OrderByDescending(s => s.ScorePercentage).ToList();
    }

    public async Task<InventorySummaryDto> GetInventorySummaryAsync(int? branchId = null)
    {
        if (!_currentUser.TenantId.HasValue) throw new InvalidOperationException("Tenant context required.");

        var query = _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == _currentUser.TenantId.Value && b.CurrentQuantity > 0);

        if (branchId.HasValue) query = query.Where(b => b.BranchId == branchId.Value);

        var batches = await query.ToListAsync();

        return new InventorySummaryDto
        {
            TotalSkus = batches.Select(b => b.ItemId).Distinct().Count(),
            TotalVolume = batches.Sum(b => b.CurrentQuantity),
            TotalValuation = batches.Sum(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0))
        };
    }

    public async Task<OrderFulfillmentMetricsDto> GetFulfillmentMetricsAsync(DateTime startDate, DateTime endDate)
    {
        if (!_currentUser.TenantId.HasValue) throw new InvalidOperationException("Tenant context required.");

        var orders = await _context.Orders
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b.Item)
            .Where(o => o.TenantId == _currentUser.TenantId.Value && o.PushedToFulfillmentAt >= startDate && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        var delivered = orders.Count(o => o.Status == "Delivered");
        decimal rate = orders.Count > 0 ? ((decimal)delivered / orders.Count) * 100 : 0;

        decimal totalCost = orders.Where(o => o.Status == "Delivered")
            .SelectMany(o => o.Allocations)
            .Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0));

        return new OrderFulfillmentMetricsDto
        {
            TotalOrders = orders.Count,
            DeliveredOrders = delivered,
            FulfillmentRate = Math.Round(rate, 2),
            TotalFulfillmentCost = totalCost
        };
    }

    public async Task<List<ConsumptionTrendDto>> GetConsumptionTrendsAsync(DateTime startDate, DateTime endDate)
    {
        if (!_currentUser.TenantId.HasValue) return [];

        var trends = await _context.ConsumptionLogs
            .Include(c => c.Branch)
            .Include(c => c.Items)
            .Where(c => c.TenantId == _currentUser.TenantId.Value && c.LogDate >= startDate && c.LogDate <= endDate)
            .ToListAsync();

        return trends.GroupBy(c => c.BranchId)
            .Select(g => new ConsumptionTrendDto
            {
                BranchId = g.Key,
                BranchName = g.First().Branch?.Name ?? "HQ",
                LogCount = g.Count(),
                TotalConsumptionVolume = g.Sum(c => c.Items.Sum(i => i.Quantity))
            })
            .OrderByDescending(t => t.TotalConsumptionVolume)
            .ToList();
    }
}
