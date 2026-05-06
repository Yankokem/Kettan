using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Analytics;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

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

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int RequireTenantId()
    {
        if (!_currentUser.TenantId.HasValue)
            throw new InvalidOperationException("Tenant context required.");
        return _currentUser.TenantId.Value;
    }

    // ── Existing Methods ──────────────────────────────────────────────────────

    public async Task<EoqResultDto> CalculateEOQAsync(int itemId)
    {
        var tenantId = RequireTenantId();

        var item = await _context.Items.FindAsync(itemId);
        if (item == null || item.TenantId != tenantId)
            throw new InvalidOperationException("Item not found.");

        decimal annualDemand = item.AnnualDemand;

        if (annualDemand <= 0)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var recentConsumption = await _context.ConsumptionLogItems
                .Where(i => i.ItemId == itemId
                    && i.TenantId == tenantId
                    && i.ConsumptionLog != null
                    && i.ConsumptionLog.LogDate >= thirtyDaysAgo)
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

        var branches = await _context.Branches
            .AsNoTracking()
            .Where(b => b.TenantId == tenantId && b.IsActive)
            .ToListAsync();

        var consumptions = await _context.ConsumptionLogs
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId
                && c.Method == ConsumptionMethod.Sales
                && c.LogDate >= startDate
                && c.LogDate <= endDate)
            .GroupBy(c => c.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count);

        var returns = await _context.Returns
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId && r.LoggedAt >= startDate && r.LoggedAt <= endDate)
            .GroupBy(r => r.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count);

        var requests = await _context.SupplyRequests
            .AsNoTracking()
            .Where(s => s.TenantId == tenantId && s.CreatedAt >= startDate && s.CreatedAt <= endDate)
            .GroupBy(s => s.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count);

        int maxSales = consumptions.Values.DefaultIfEmpty(0).Max();
        var scorecards = new List<BranchScorecardDto>();

        foreach (var branch in branches)
        {
            int salesScore = consumptions.TryGetValue(branch.BranchId, out var s) ? s : 0;
            int returnScore = returns.TryGetValue(branch.BranchId, out var r) ? r : 0;
            int reqCount = requests.TryGetValue(branch.BranchId, out var req) ? req : 0;

            decimal baseScore = maxSales > 0 ? ((decimal)salesScore / maxSales) * 100m : 50m;
            decimal penalty = returnScore * 5m; // Adjusted penalty
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
        var tenantId = RequireTenantId();

        var query = _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == tenantId && b.CurrentQuantity > 0);

        if (branchId.HasValue)
            query = query.Where(b => b.BranchId == branchId.Value);

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
        var tenantId = RequireTenantId();

        var orders = await _context.Orders
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b.Item)
            .Where(o => o.TenantId == tenantId
                && o.PushedToFulfillmentAt >= startDate
                && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        var delivered = orders.Count(o => o.Status == OrderStatus.Delivered);
        decimal rate = orders.Count > 0 ? ((decimal)delivered / orders.Count) * 100 : 0;

        decimal totalCost = orders
            .Where(o => o.Status == OrderStatus.Delivered)
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
        var tenantId = _currentUser.TenantId.Value;

        var trends = await _context.ConsumptionLogs
            .Include(c => c.Branch)
            .Include(c => c.Items)
            .Where(c => c.TenantId == tenantId
                && c.LogDate >= startDate
                && c.LogDate <= endDate)
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

    // ── New HQ Methods ────────────────────────────────────────────────────────

    public async Task<HqOverviewDto> GetHqOverviewAsync(DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        // Fulfillment cost & rate
        var fulfillment = await GetFulfillmentMetricsAsync(startDate, endDate);

        // Chain inventory value (all batches across HQ + branches)
        var allBatches = await _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == tenantId && b.CurrentQuantity > 0)
            .ToListAsync();
        decimal chainInventoryValue = allBatches.Sum(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0));

        // Wastage/spoilage loss
        var wastageTransactions = await _context.InventoryTransactions
            .Include(t => t.Batch)
                .ThenInclude(b => b.Item)
            .Where(t => t.TenantId == tenantId
                && t.Timestamp >= startDate
                && t.Timestamp <= endDate
                && t.TransactionType == TransactionType.Adjustment
                && t.QuantityChange < 0)
            .ToListAsync();
        decimal wastageLoss = wastageTransactions.Sum(t =>
            Math.Abs(t.QuantityChange) * (t.Batch?.Item?.UnitCost ?? 0));

        // Return loss (credited returns = cost credited back = loss to chain)
        var returnLoss = await _context.Returns
            .Where(r => r.TenantId == tenantId
                && r.LoggedAt >= startDate
                && r.LoggedAt <= endDate
                && r.Resolution == ReturnResolution.Credited)
            .SumAsync(r => r.CreditAmount ?? 0);

        // Top performer
        var scores = await CalculateBranchScoresAsync(startDate, endDate);
        var top = scores.FirstOrDefault();

        return new HqOverviewDto
        {
            TotalFulfillmentCost = fulfillment.TotalFulfillmentCost,
            TotalChainInventoryValue = chainInventoryValue,
            TotalWastageLoss = wastageLoss,
            TotalReturnLoss = returnLoss,
            TopPerformerName = top?.BranchName ?? string.Empty,
            TopPerformerScore = top?.ScorePercentage ?? 0,
            FulfillmentRate = fulfillment.FulfillmentRate,
            TotalOrders = fulfillment.TotalOrders
        };
    }

    public async Task<List<CostTrendPointDto>> GetCostTrendAsync(DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var orders = await _context.Orders
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b.Item)
            .Include(o => o.Shipment)
            .Where(o => o.TenantId == tenantId
                && o.Status == OrderStatus.Delivered
                && o.PushedToFulfillmentAt >= startDate
                && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        var grouped = orders
            .GroupBy(o => new
            {
                Year = o.PushedToFulfillmentAt.Year,
                Month = o.PushedToFulfillmentAt.Month
            })
            .Select(g => new CostTrendPointDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Label = new DateTime(g.Key.Year, g.Key.Month, 1, 0, 0, 0, DateTimeKind.Utc).ToString("MMM yyyy"),
                FulfillmentCost = g.SelectMany(o => o.Allocations)
                    .Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)),
                ShippingCost = g.Sum(o => o.Shipment != null ? o.Shipment.ShippingCost : 0)
            })
            .OrderBy(p => p.Year).ThenBy(p => p.Month)
            .ToList();

        return grouped;
    }

    public async Task<List<BranchSpendDto>> GetBranchSpendAsync(DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var orders = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(sr => sr!.Branch)
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b.Item)
            .Where(o => o.TenantId == tenantId
                && o.Status == OrderStatus.Delivered
                && o.PushedToFulfillmentAt >= startDate
                && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        return orders
            .GroupBy(o => new
            {
                BranchId = o.SupplyRequest?.BranchId ?? 0,
                BranchName = o.SupplyRequest?.Branch?.Name ?? "Unknown"
            })
            .Select(g => new BranchSpendDto
            {
                BranchId = g.Key.BranchId,
                BranchName = g.Key.BranchName,
                TotalSpend = g.SelectMany(o => o.Allocations)
                    .Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0))
            })
            .OrderByDescending(b => b.TotalSpend)
            .ToList();
    }

    public async Task<List<BranchInventoryValuationDto>> GetAllBranchInventoryValuationsAsync()
    {
        var tenantId = RequireTenantId();

        var branches = await _context.Branches
            .Where(b => b.TenantId == tenantId && b.IsActive)
            .ToListAsync();

        var batchesByBranch = await _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == tenantId
                && b.BranchId != null
                && b.CurrentQuantity > 0)
            .GroupBy(b => b.BranchId!.Value)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.ToList()
            );

        return branches.Select(branch =>
        {
            var batches = batchesByBranch.TryGetValue(branch.BranchId, out var b) ? b : [];
            return new BranchInventoryValuationDto
            {
                BranchId = branch.BranchId,
                BranchName = branch.Name,
                TotalSkus = batches.Select(x => x.ItemId).Distinct().Count(),
                TotalVolume = batches.Sum(x => x.CurrentQuantity),
                TotalValuation = batches.Sum(x => x.CurrentQuantity * (x.Item?.UnitCost ?? 0))
            };
        })
        .OrderByDescending(b => b.TotalValuation)
        .ToList();
    }

    public async Task<List<WastageRecordDto>> GetWastageRecordsAsync(
        DateTime startDate, DateTime endDate, int? branchId = null)
    {
        var tenantId = RequireTenantId();

        var query = _context.InventoryTransactions
            .Include(t => t.Batch)
                .ThenInclude(b => b.Item)
            .Include(t => t.User)
            .Where(t => t.TenantId == tenantId
                && t.Timestamp >= startDate
                && t.Timestamp <= endDate
                && t.TransactionType == TransactionType.Adjustment
                && t.QuantityChange < 0);

        if (branchId.HasValue)
            query = query.Where(t => t.Batch != null && t.Batch.BranchId == branchId.Value);

        var records = await query
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();

        return records.Select(t => new WastageRecordDto
        {
            TransactionId = t.TransactionId,
            ItemName = t.Batch?.Item?.Name ?? string.Empty,
            ItemSku = t.Batch?.Item?.SKU ?? string.Empty,
            QuantityLost = Math.Abs(t.QuantityChange),
            Unit = t.Batch?.Item?.Unit ?? string.Empty,
            UnitCost = t.Batch?.Item?.UnitCost ?? 0,
            TotalLoss = Math.Abs(t.QuantityChange) * (t.Batch?.Item?.UnitCost ?? 0),
            Reason = t.Remarks ?? string.Empty,
            LoggedByName = t.User?.FullName ?? string.Empty,
            Timestamp = t.Timestamp
        }).ToList();
    }

    public async Task<List<EoqSuggestionDto>> GetEoqSuggestionsAsync(int? branchId = null)
    {
        var tenantId = RequireTenantId();

        var items = await _context.Items
            .Where(i => i.TenantId == tenantId && !i.IsDeleted)
            .ToListAsync();

        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        // Get recent consumption per item (optionally filtered by branch)
        var consumptionQuery = _context.ConsumptionLogItems
            .Where(ci => ci.TenantId == tenantId
                && ci.ConsumptionLog != null
                && ci.ConsumptionLog.LogDate >= sevenDaysAgo)
            .Where(ci => ci.ItemId != null);

        if (branchId.HasValue)
            consumptionQuery = consumptionQuery.Where(ci => ci.ConsumptionLog!.BranchId == branchId.Value);

        var consumptionByItem = await consumptionQuery
            .GroupBy(ci => ci.ItemId!.Value)
            .Select(g => new { ItemId = g.Key, Total = g.Sum(ci => ci.Quantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Total);

        // Get current stock per item (optionally filtered by branch)
        var stockQuery = _context.Batches
            .Where(b => b.TenantId == tenantId
                && b.CurrentQuantity > 0);

        if (branchId.HasValue)
            stockQuery = stockQuery.Where(b => b.BranchId == branchId.Value);
        else
            stockQuery = stockQuery.Where(b => b.BranchId == null); // HQ only if no branchId

        var stockByItem = await stockQuery
            .GroupBy(b => b.ItemId)
            .Select(g => new { ItemId = g.Key, Total = g.Sum(b => b.CurrentQuantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Total);

        var suggestions = new List<EoqSuggestionDto>();

        foreach (var item in items)
        {
            // Calculate annual demand: manual setting OR (last 7 days * 52 weeks)
            var annualDemand = item.AnnualDemand > 0
                ? item.AnnualDemand
                : (consumptionByItem.TryGetValue(item.ItemId, out var recent) ? recent * 52.14m : 0);

            // Use fallbacks for S and H if they are not configured
            var s = item.SetupCost > 0 ? item.SetupCost : 100m;
            var h = item.HoldingCost > 0 ? item.HoldingCost : Math.Max(1.0m, item.UnitCost * 0.2m);

            decimal eoq = 0;
            if (annualDemand > 0)
                eoq = (decimal)Math.Sqrt((double)((2 * annualDemand * s) / h));

            suggestions.Add(new EoqSuggestionDto
            {
                ItemId = item.ItemId,
                ItemName = item.Name,
                ItemSku = item.SKU,
                Unit = item.Unit,
                CurrentStock = stockByItem.TryGetValue(item.ItemId, out var stock) ? stock : 0,
                AnnualDemand = annualDemand,
                EOQ = Math.Round(eoq, 2),
                UnitCost = item.UnitCost,
                SetupCost = s,
                HoldingCost = h
            });
        }

        return suggestions
            .Where(s => s.EOQ > 0)
            .OrderByDescending(s => s.AnnualDemand)
            .ThenByDescending(s => s.EOQ)
            .ToList();
    }

    public async Task<ReturnsLossOverviewDto> GetReturnsLossOverviewAsync(
        DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var returns = await _context.Returns
            .Where(r => r.TenantId == tenantId
                && r.LoggedAt >= startDate
                && r.LoggedAt <= endDate)
            .ToListAsync();

        var totalOrders = await _context.Orders
            .Where(o => o.TenantId == tenantId
                && o.PushedToFulfillmentAt >= startDate
                && o.PushedToFulfillmentAt <= endDate)
            .CountAsync();

        decimal creditedLoss = returns
            .Where(r => r.Resolution == ReturnResolution.Credited)
            .Sum(r => r.CreditAmount ?? 0);

        decimal avgReturnRate = totalOrders > 0
            ? Math.Round(((decimal)returns.Count / totalOrders) * 100, 2)
            : 0;

        return new ReturnsLossOverviewDto
        {
            TotalReturns = returns.Count,
            ReplacedCount = returns.Count(r => r.Resolution == ReturnResolution.Replaced),
            CreditedCount = returns.Count(r => r.Resolution == ReturnResolution.Credited),
            RejectedCount = returns.Count(r => r.Resolution == ReturnResolution.Rejected),
            TotalMoneyLost = creditedLoss,
            AverageReturnRate = avgReturnRate
        };
    }

    public async Task<List<ReturnLossRecordDto>> GetReturnLossRecordsAsync(
        DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        return await _context.Returns
            .Include(r => r.Branch)
            .Include(r => r.Items)
            .Where(r => r.TenantId == tenantId
                && r.LoggedAt >= startDate
                && r.LoggedAt <= endDate)
            .OrderByDescending(r => r.LoggedAt)
            .Select(r => new ReturnLossRecordDto
            {
                ReturnId = r.ReturnId,
                OrderId = r.OrderId,
                BranchName = r.Branch != null ? r.Branch.Name : string.Empty,
                Resolution = r.Resolution.ToString(),
                Reason = r.Reason ?? string.Empty,
                CreditAmount = r.CreditAmount ?? 0,
                ItemCount = r.Items.Count,
                LoggedAt = r.LoggedAt
            })
            .ToListAsync();
    }

    public async Task<BranchOverviewDto> GetBranchOverviewAsync(
        int branchId, DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        // Branch inventory value
        var batches = await _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == tenantId
                && b.BranchId == branchId
                && b.CurrentQuantity > 0)
            .ToListAsync();

        decimal inventoryValue = batches.Sum(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0));
        int totalSkus = batches.Select(b => b.ItemId).Distinct().Count();

        // Total supply spend received (delivered orders to this branch)
        var orders = await _context.Orders
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b.Item)
            .Include(o => o.SupplyRequest)
            .Where(o => o.TenantId == tenantId
                && o.Status == OrderStatus.Delivered
                && o.SupplyRequest != null
                && o.SupplyRequest.BranchId == branchId
                && o.PushedToFulfillmentAt >= startDate
                && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        decimal supplySpend = orders.SelectMany(o => o.Allocations)
            .Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0));

        // Wastage loss for this branch
        var wastage = await _context.InventoryTransactions
            .Include(t => t.Batch)
                .ThenInclude(b => b.Item)
            .Where(t => t.TenantId == tenantId
                && t.Batch != null
                && t.Batch.BranchId == branchId
                && t.TransactionType == TransactionType.Adjustment
                && t.QuantityChange < 0
                && t.Timestamp >= startDate
                && t.Timestamp <= endDate)
            .ToListAsync();

        decimal wastageLoss = wastage.Sum(t =>
            Math.Abs(t.QuantityChange) * (t.Batch?.Item?.UnitCost ?? 0));

        // Performance score & rank
        var allScores = await CalculateBranchScoresAsync(startDate, endDate);
        var myScore = allScores.FirstOrDefault(s => s.BranchId == branchId);
        var rank = allScores.FindIndex(s => s.BranchId == branchId) + 1;

        return new BranchOverviewDto
        {
            InventoryValue = inventoryValue,
            TotalSkus = totalSkus,
            TotalSupplySpendReceived = supplySpend,
            WastageLoss = wastageLoss,
            PerformanceScore = myScore?.ScorePercentage ?? 0,
            RankInChain = rank > 0 ? rank : allScores.Count,
            TotalBranchesInChain = allScores.Count
        };
    }

    public async Task<List<WastageRecordDto>> GetBranchWastageAsync(
        int branchId, DateTime startDate, DateTime endDate)
    {
        return await GetWastageRecordsAsync(startDate, endDate, branchId);
    }

    public async Task<List<BranchSupplyHistoryDto>> GetBranchSupplyHistoryAsync(
        int branchId, DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var requests = await _context.SupplyRequests
            .Include(sr => sr.Orders)
                .ThenInclude(o => o.Allocations)
                    .ThenInclude(a => a.Batch)
                        .ThenInclude(b => b.Item)
            .Where(sr => sr.TenantId == tenantId
                && sr.BranchId == branchId
                && sr.CreatedAt >= startDate
                && sr.CreatedAt <= endDate)
            .OrderByDescending(sr => sr.CreatedAt)
            .ToListAsync();

        return requests.Select(sr =>
        {
            var order = sr.Orders.FirstOrDefault();
            decimal cost = order?.Allocations
                .Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)) ?? 0;

            bool fullyFulfilled = order != null && sr.Items != null
                && sr.Items.All(i => i.QuantityApproved >= i.QuantityRequested);

            return new BranchSupplyHistoryDto
            {
                RequestId = sr.RequestId,
                ReferenceNumber = sr.ReferenceNumber ?? $"SR-{sr.RequestId}",
                Status = sr.Status.ToString(),
                Priority = sr.Priority.ToString(),
                FulfillmentCost = cost,
                IsFullyFulfilled = fullyFulfilled,
                CreatedAt = sr.CreatedAt,
                DeliveredAt = order?.DeliveredAt
            };
        }).ToList();
    }

    public async Task<BranchPerformanceDetailDto> GetBranchPerformanceDetailAsync(
        int branchId, DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var allScores = await CalculateBranchScoresAsync(startDate, endDate);
        var myEntry = allScores.FirstOrDefault(s => s.BranchId == branchId);
        var rank = allScores.FindIndex(s => s.BranchId == branchId) + 1;

        // Fulfillment rate for this branch
        var orders = await _context.Orders
            .Include(o => o.SupplyRequest)
            .Where(o => o.TenantId == tenantId
                && o.SupplyRequest != null
                && o.SupplyRequest.BranchId == branchId
                && o.PushedToFulfillmentAt >= startDate
                && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        int totalOrders = orders.Count;
        int deliveredOrders = orders.Count(o => o.Status == OrderStatus.Delivered);
        decimal fulfillmentRate = totalOrders > 0
            ? Math.Round(((decimal)deliveredOrders / totalOrders) * 100, 1)
            : 0;

        // Return rate
        int returnsCount = myEntry?.ReturnsCount ?? 0;
        decimal returnRate = totalOrders > 0
            ? Math.Round(((decimal)returnsCount / Math.Max(totalOrders, 1)) * 100, 1)
            : 0;

        // Average delivery speed (hours from approval to delivery)
        var deliveredWithDates = orders
            .Where(o => o.Status == OrderStatus.Delivered
                && o.ArrivedAt.HasValue)
            .ToList();

        decimal avgSpeedHrs = deliveredWithDates.Count > 0
            ? (decimal)deliveredWithDates
                .Average(o => (o.ArrivedAt!.Value - o.PushedToFulfillmentAt).TotalHours)
            : 0;

        // Stock accuracy approximation (100 - normalized wastage penalty)
        var wastage = await _context.InventoryTransactions
            .Where(t => t.TenantId == tenantId
                && t.Batch != null
                && t.Batch.BranchId == branchId
                && t.TransactionType == TransactionType.Adjustment
                && t.QuantityChange < 0
                && t.Timestamp >= startDate
                && t.Timestamp <= endDate)
            .CountAsync();

        decimal stockAccuracy = Math.Clamp(100 - (wastage * 2m), 50, 100);

        // Weighted score: Fulfillment(30%) + ReturnRate(20% inverted) + Speed(25% inverted) + Accuracy(25%)
        decimal speedScore = avgSpeedHrs > 0
            ? Math.Clamp(100 - (decimal)(avgSpeedHrs / 24.0m) * 20, 0, 100)
            : 100;
        decimal returnScore = Math.Clamp(100 - (returnRate * 5), 0, 100);

        decimal weightedScore = Math.Round(
            (fulfillmentRate * 0.30m) +
            (returnScore * 0.20m) +
            (speedScore * 0.25m) +
            (stockAccuracy * 0.25m), 1);

        return new BranchPerformanceDetailDto
        {
            WeightedScore = weightedScore,
            FulfillmentRate = fulfillmentRate,
            ReturnRate = returnRate,
            DeliverySpeedHrs = Math.Round(avgSpeedHrs, 1),
            StockAccuracy = Math.Round(stockAccuracy, 1),
            RankInChain = rank > 0 ? rank : allScores.Count,
            TotalBranches = allScores.Count
        };
    }

    public async Task<List<TrendPointDto>> GetBranchSalesTrendAsync(int branchId, DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var logs = await _context.ConsumptionLogs
            .Include(l => l.Items)
                .ThenInclude(i => i.Item)
            .Where(l => l.TenantId == tenantId 
                && l.BranchId == branchId 
                && l.LogDate >= startDate 
                && l.LogDate <= endDate)
            .ToListAsync();

        var daily = logs.GroupBy(l => l.LogDate.Date)
            .Select(g => new TrendPointDto
            {
                Label = g.Key.ToString("MMM dd"),
                Value = g.SelectMany(l => l.Items).Sum(i => i.Quantity * (i.Item?.SellingPrice ?? 0))
            })
            .ToList();

        return FillMissingDates(daily, startDate, endDate);
    }

    public async Task<List<BranchTrendDto>> GetHqSupplyTrendAsync(DateTime startDate, DateTime endDate)
    {
        var tenantId = RequireTenantId();

        var orders = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(sr => sr!.Branch)
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b.Item)
            .Where(o => o.TenantId == tenantId 
                && o.PushedToFulfillmentAt >= startDate 
                && o.PushedToFulfillmentAt <= endDate)
            .ToListAsync();

        var branches = orders.Where(o => o.SupplyRequest?.Branch != null)
            .Select(o => o.SupplyRequest!.Branch!)
            .DistinctBy(b => b.BranchId)
            .ToList();

        var result = new List<BranchTrendDto>();

        foreach (var branch in branches)
        {
            var branchDaily = orders.Where(o => o.SupplyRequest?.BranchId == branch.BranchId)
                .GroupBy(o => o.PushedToFulfillmentAt.Date)
                .Select(g => new TrendPointDto
                {
                    Label = g.Key.ToString("MMM dd"),
                    Value = g.SelectMany(o => o.Allocations).Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0))
                })
                .ToList();

            result.Add(new BranchTrendDto
            {
                BranchName = branch.Name,
                Points = FillMissingDates(branchDaily, startDate, endDate)
            });
        }

        return result;
    }

    public async Task<List<LowStockAlertDto>> GetLowStockAlertsAsync(int? branchId = null)
    {
        var query = _context.Batches
            .Include(b => b.Item)
            .Include(b => b.Branch)
            .AsNoTracking();

        if (branchId.HasValue)
        {
            query = query.Where(b => b.BranchId == branchId.Value);
        }
        else
        {
            // HQ only sees their own warehouse stock alerts on their dashboard
            query = query.Where(b => b.BranchId == null);
        }

        var stockGrouped = await query
            .GroupBy(b => new { b.ItemId, b.BranchId, b.Item!.Name, b.Item.SKU, b.Item.Unit, b.Item.DefaultThreshold, BranchName = b.Branch!.Name })
            .Select(g => new
            {
                g.Key.ItemId,
                g.Key.BranchId,
                g.Key.Name,
                g.Key.SKU,
                g.Key.Unit,
                g.Key.DefaultThreshold,
                g.Key.BranchName,
                TotalStock = g.Sum(b => b.CurrentQuantity)
            })
            .ToListAsync();

        // Get custom settings for these items/branches
        var branchIds = stockGrouped.Select(s => s.BranchId).Distinct().ToList();
        var itemIds = stockGrouped.Select(s => s.ItemId).Distinct().ToList();

        var customSettingsList = await _context.BranchItemSettings
            .Where(s => branchIds.Contains(s.BranchId) && itemIds.Contains(s.ItemId))
            .ToListAsync();

        var customSettings = customSettingsList
            .ToDictionary(s => $"{(s.BranchId?.ToString() ?? "HQ")}_{s.ItemId}", s => s.LowStockThreshold);

        var results = stockGrouped
            .Select(s => {
                var key = $"{(s.BranchId?.ToString() ?? "HQ")}_{s.ItemId}";
                var threshold = customSettings.TryGetValue(key, out var custom) 
                    ? custom 
                    : s.DefaultThreshold;
                
                return new LowStockAlertDto
                {
                    ItemId = s.ItemId,
                    ItemName = s.Name,
                    SKU = s.SKU,
                    BranchName = s.BranchName ?? "HQ",
                    CurrentStock = s.TotalStock,
                    Threshold = threshold,
                    Unit = s.Unit
                };
            })
            .Where(a => a.Threshold > 0 && a.CurrentStock <= a.Threshold)
            .OrderBy(a => a.Threshold > 0 ? (a.CurrentStock / a.Threshold) : 0)
            .ToList();

        return results;
    }

    private List<TrendPointDto> FillMissingDates(List<TrendPointDto> points, DateTime start, DateTime end)
    {
        var result = new List<TrendPointDto>();
        var lookup = points.ToDictionary(p => p.Label, p => p.Value);

        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
        {
            var label = date.ToString("MMM dd");
            result.Add(new TrendPointDto
            {
                Label = label,
                Value = lookup.TryGetValue(label, out var val) ? val : 0
            });
        }

        return result;
    }
}