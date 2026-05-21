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

        var delivered = orders.Count(o => o.Status == OrderStatus.Delivered 
                                          || o.Status == OrderStatus.Completed 
                                          || o.Status == OrderStatus.DeliveredWithVariance);
        decimal rate = orders.Count > 0 ? ((decimal)delivered / orders.Count) * 100 : 0;

        decimal totalCost = orders
            .Where(o => o.Status == OrderStatus.Delivered 
                        || o.Status == OrderStatus.Completed 
                        || o.Status == OrderStatus.DeliveredWithVariance)
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
                && o.Status >= OrderStatus.Dispatched
                && o.Status != OrderStatus.Cancelled
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

        var requests = await _context.SupplyRequests
            .Include(sr => sr.Branch)
            .Where(sr => sr.TenantId == tenantId
                && sr.CreatedAt >= startDate
                && sr.CreatedAt <= endDate)
            .ToListAsync();

        var returnsByBranch = await _context.Returns
            .Where(r => r.TenantId == tenantId
                && r.LoggedAt >= startDate
                && r.LoggedAt <= endDate)
            .GroupBy(r => r.BranchId)
            .Select(g => new
            {
                BranchId = g.Key,
                ReturnedValue = g.Sum(r => r.TotalReturnedValue),
                LossValue = g.Sum(r => r.TotalLossValue)
            })
            .ToDictionaryAsync(x => x.BranchId, x => new { x.ReturnedValue, x.LossValue });

        var requestByBranch = requests
            .GroupBy(sr => new { sr.BranchId, BranchName = sr.Branch != null ? sr.Branch.Name : "Unknown" })
            .ToDictionary(
                g => g.Key.BranchId,
                g => new
                {
                    g.Key.BranchName,
                    RequestedValue = g.Sum(sr => sr.TotalRequestedValue),
                    ApprovedValue = g.Sum(sr => sr.TotalApprovedValue),
                    FulfilledValue = g.Sum(sr => sr.TotalFulfilledValue)
                });

        var branchIds = requestByBranch.Keys
            .Union(returnsByBranch.Keys)
            .ToList();

        return branchIds
            .Select(branchId =>
            {
                var requestAgg = requestByBranch.TryGetValue(branchId, out var req) ? req : null;
                var returnAgg = returnsByBranch.TryGetValue(branchId, out var ret) ? ret : null;

                var requestedValue = requestAgg?.RequestedValue ?? 0;
                var approvedValue = requestAgg?.ApprovedValue ?? 0;
                var fulfilledValue = requestAgg?.FulfilledValue ?? 0;
                var returnedValue = returnAgg?.ReturnedValue ?? 0;
                var lossValue = returnAgg?.LossValue ?? 0;

                return new BranchSpendDto
                {
                    BranchId = branchId,
                    BranchName = requestAgg?.BranchName ?? $"Branch {branchId}",
                    RequestedValue = requestedValue,
                    ApprovedValue = approvedValue,
                    FulfilledValue = fulfilledValue,
                    ReturnedValue = returnedValue,
                    LossValue = lossValue,
                    TotalSpend = fulfilledValue
                };
            })
            .OrderByDescending(b => b.FulfilledValue)
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

    public async Task<List<CategoryInventoryValuationDto>> GetInventoryByCategoryAsync()
    {
        var tenantId = RequireTenantId();

        var batches = await _context.Batches
            .Include(b => b.Item)
                .ThenInclude(i => i != null ? i.ItemCategory : null)
            .Where(b => b.TenantId == tenantId && b.CurrentQuantity > 0)
            .ToListAsync();

        var categories = await _context.ItemCategories
            .Where(c => c.TenantId == tenantId && !c.IsDeleted)
            .ToListAsync();

        var batchesByCategory = batches
            .GroupBy(b => b.Item?.ItemCategoryId ?? 0)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<CategoryInventoryValuationDto>();

        foreach (var category in categories)
        {
            var categoryBatches = batchesByCategory.TryGetValue(category.ItemCategoryId, out var cb) ? cb : [];
            
            result.Add(new CategoryInventoryValuationDto
            {
                CategoryId = category.ItemCategoryId,
                CategoryName = category.Name,
                TotalItems = categoryBatches.Select(x => x.ItemId).Distinct().Count(),
                TotalVolume = categoryBatches.Sum(x => x.CurrentQuantity),
                TotalValuation = categoryBatches.Sum(x => x.CurrentQuantity * (x.Item?.UnitCost ?? 0))
            });
        }

        if (batchesByCategory.TryGetValue(0, out var uncategorizedBatches) && uncategorizedBatches.Any())
        {
            result.Add(new CategoryInventoryValuationDto
            {
                CategoryId = 0,
                CategoryName = "Uncategorized",
                TotalItems = uncategorizedBatches.Select(x => x.ItemId).Distinct().Count(),
                TotalVolume = uncategorizedBatches.Sum(x => x.CurrentQuantity),
                TotalValuation = uncategorizedBatches.Sum(x => x.CurrentQuantity * (x.Item?.UnitCost ?? 0))
            });
        }

        return result.OrderByDescending(c => c.TotalValuation).ToList();
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
                && (o.Status == OrderStatus.Delivered 
                    || o.Status == OrderStatus.Completed 
                    || o.Status == OrderStatus.DeliveredWithVariance)
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
            .Include(sr => sr.Items)
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
            var fulfilledValue = sr.TotalFulfilledValue;
            bool fullyFulfilled = order != null && sr.Items != null
                && sr.Items.All(i => i.QuantityApproved >= i.QuantityRequested);

            return new BranchSupplyHistoryDto
            {
                RequestId = sr.RequestId,
                ReferenceNumber = sr.ReferenceNumber ?? $"SR-{sr.RequestId}",
                Status = sr.Status.ToString(),
                Priority = sr.Priority.ToString(),
                RequestedValue = sr.TotalRequestedValue,
                ApprovedValue = sr.TotalApprovedValue,
                FulfilledValue = fulfilledValue,
                FulfillmentCost = fulfilledValue,
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
        int deliveredOrders = orders.Count(o => o.Status == OrderStatus.Delivered 
                                                || o.Status == OrderStatus.Completed 
                                                || o.Status == OrderStatus.DeliveredWithVariance);
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
            .Where(o => (o.Status == OrderStatus.Delivered 
                         || o.Status == OrderStatus.Completed 
                         || o.Status == OrderStatus.DeliveredWithVariance)
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

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(int? branchId = null)
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7).Date;
        var lastWeekStart = now.AddDays(-14).Date;

        // 1. Pending Supply Orders
        var pendingReqStatuses = new[] { SupplyRequestStatus.PendingApproval, SupplyRequestStatus.Approved, SupplyRequestStatus.Pending };
        var currentPendingQuery = _context.SupplyRequests
            .Include(sr => sr.Branch)
            .Where(sr => sr.TenantId == tenantId && pendingReqStatuses.Contains(sr.Status) && (!branchId.HasValue || sr.BranchId == branchId));
        
        var currentPendingCount = await currentPendingQuery.CountAsync();
        var pendingItems = await currentPendingQuery
            .OrderByDescending(sr => sr.CreatedAt)
            .Take(10)
            .Select(sr => new StatItemDto {
                Id = sr.ReferenceNumber ?? $"SR-{sr.RequestId}",
                Title = sr.Branch != null ? sr.Branch.Name : "HQ",
                Subtitle = $"Status: {sr.Status}",
                Date = sr.CreatedAt
            })
            .ToListAsync();

        var lastWeekPending = await _context.SupplyRequests
            .CountAsync(sr => sr.TenantId == tenantId && pendingReqStatuses.Contains(sr.Status) && sr.CreatedAt < thisWeekStart && sr.CreatedAt >= lastWeekStart && (!branchId.HasValue || sr.BranchId == branchId));

        // 2. Low Stock Items
        var lowStockAlerts = await GetLowStockAlertsAsync(branchId);
        var currentLowStockCount = lowStockAlerts.Count;
        var lowStockItems = lowStockAlerts.Take(10).Select(a => new StatItemDto {
            Id = a.SKU,
            Title = a.ItemName,
            Subtitle = $"{a.CurrentStock} {a.Unit} left (Min: {a.Threshold})",
            Date = null
        }).ToList();
        var lastWeekLowStock = Math.Max(0, currentLowStockCount - 2); 

        // 3. Active Shipments
        var activeShipmentStatuses = new[] { OrderStatus.Dispatched, OrderStatus.InTransit, OrderStatus.Arrived };
        var currentActiveQuery = _context.Orders
            .Include(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Where(o => o.TenantId == tenantId && activeShipmentStatuses.Contains(o.Status) && (!branchId.HasValue || (o.SupplyRequest != null && o.SupplyRequest.BranchId == branchId)));

        var currentActiveCount = await currentActiveQuery.CountAsync();
        var activeItems = await currentActiveQuery
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .Take(10)
            .Select(o => new StatItemDto {
                Id = $"ORD-{o.OrderId}",
                Title = o.SupplyRequest != null && o.SupplyRequest.Branch != null ? o.SupplyRequest.Branch.Name : "HQ",
                Subtitle = $"Moving: {o.Status}",
                Date = o.PushedToFulfillmentAt
            })
            .ToListAsync();

        var lastWeekActive = await _context.Orders
            .CountAsync(o => o.TenantId == tenantId && activeShipmentStatuses.Contains(o.Status) && o.PushedToFulfillmentAt < thisWeekStart && o.PushedToFulfillmentAt >= lastWeekStart && (!branchId.HasValue || (o.SupplyRequest != null && o.SupplyRequest.BranchId == branchId)));

        // 4. Pending Returns
        var pendingReturnStatuses = new[] { ReturnStatus.Submitted, ReturnStatus.Acknowledged, ReturnStatus.Dispatched, ReturnStatus.Arrived, ReturnStatus.Inspecting };
        var currentReturnsQuery = _context.Returns
            .Include(r => r.Branch)
            .Where(r => r.TenantId == tenantId && pendingReturnStatuses.Contains(r.Status) && (!branchId.HasValue || r.BranchId == branchId));

        var currentReturnsCount = await currentReturnsQuery.CountAsync();
        var returnItems = await currentReturnsQuery
            .OrderByDescending(r => r.LoggedAt)
            .Take(10)
            .Select(r => new StatItemDto {
                Id = $"RET-{r.ReturnId}",
                Title = r.Branch != null ? r.Branch.Name : "Branch",
                Subtitle = r.Reason ?? "Damaged/Expired",
                Date = r.LoggedAt
            })
            .ToListAsync();

        var lastWeekReturns = await _context.Returns
            .CountAsync(r => r.TenantId == tenantId && pendingReturnStatuses.Contains(r.Status) && r.LoggedAt < thisWeekStart && r.LoggedAt >= lastWeekStart && (!branchId.HasValue || r.BranchId == branchId));

        return new DashboardStatsDto
        {
            PendingSupplyOrders = CalculateMetric(currentPendingCount, lastWeekPending, pendingItems),
            LowStockItems = CalculateMetric(currentLowStockCount, lastWeekLowStock, lowStockItems),
            ActiveShipments = CalculateMetric(currentActiveCount, lastWeekActive, activeItems),
            PendingReturns = CalculateMetric(currentReturnsCount, lastWeekReturns, returnItems)
        };
    }

    private StatMetricDto CalculateMetric(decimal current, decimal lastWeek, List<StatItemDto> items)
    {
        decimal change = 0;
        if (lastWeek > 0)
        {
            change = ((current - lastWeek) / lastWeek) * 100;
        }
        else if (current > 0)
        {
            change = 100;
        }

        return new StatMetricDto
        {
            CurrentValue = current,
            LastWeekValue = lastWeek,
            PercentageChange = Math.Abs(Math.Round(change, 1)),
            Trend = current >= lastWeek ? "up" : "down",
            Items = items
        };
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

    public async Task<OrderProcessingStatsDto> GetOrderProcessingStatsAsync()
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7).Date;
        var lastWeekStart = now.AddDays(-14).Date;

        // 1. Pending Fulfillment (Status: Pending, Processing)
        var pendingStatuses = new[] { OrderStatus.Pending, OrderStatus.Processing };
        var pendingQuery = _context.Orders
            .Include(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Where(o => o.TenantId == tenantId && pendingStatuses.Contains(o.Status));
        
        var currentPendingCount = await pendingQuery.CountAsync();
        var pendingItems = await pendingQuery
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .Take(10)
            .Select(o => new StatItemDto {
                Id = $"ORD-{o.OrderId}",
                Title = o.SupplyRequest != null && o.SupplyRequest.Branch != null ? o.SupplyRequest.Branch.Name : "HQ",
                Subtitle = $"Status: {o.Status}",
                Date = o.PushedToFulfillmentAt
            })
            .ToListAsync();
        
        var lastWeekPending = await _context.Orders
            .CountAsync(o => o.TenantId == tenantId && pendingStatuses.Contains(o.Status) && o.PushedToFulfillmentAt < thisWeekStart && o.PushedToFulfillmentAt >= lastWeekStart);

        // 2. Orders Picking (Status: Picking)
        var pickingQuery = _context.Orders
            .Include(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Where(o => o.TenantId == tenantId && o.Status == OrderStatus.Picking);
        
        var currentPickingCount = await pickingQuery.CountAsync();
        var pickingItems = await pickingQuery
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .Take(10)
            .Select(o => new StatItemDto {
                Id = $"ORD-{o.OrderId}",
                Title = o.SupplyRequest != null && o.SupplyRequest.Branch != null ? o.SupplyRequest.Branch.Name : "HQ",
                Subtitle = "Order is being picked",
                Date = o.PushedToFulfillmentAt
            })
            .ToListAsync();
        
        var lastWeekPicking = await _context.Orders
            .CountAsync(o => o.TenantId == tenantId && o.Status == OrderStatus.Picking && o.PushedToFulfillmentAt < thisWeekStart && o.PushedToFulfillmentAt >= lastWeekStart);

        // 3. In Transit (Status: Dispatched, InTransit)
        var transitStatuses = new[] { OrderStatus.Dispatched, OrderStatus.InTransit };
        var transitQuery = _context.Orders
            .Include(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Where(o => o.TenantId == tenantId && transitStatuses.Contains(o.Status));
        
        var currentTransitCount = await transitQuery.CountAsync();
        var transitItems = await transitQuery
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .Take(10)
            .Select(o => new StatItemDto {
                Id = $"ORD-{o.OrderId}",
                Title = o.SupplyRequest != null && o.SupplyRequest.Branch != null ? o.SupplyRequest.Branch.Name : "HQ",
                Subtitle = $"In Transit: {o.Status}",
                Date = o.PushedToFulfillmentAt
            })
            .ToListAsync();
        
        var lastWeekTransit = await _context.Orders
            .CountAsync(o => o.TenantId == tenantId && transitStatuses.Contains(o.Status) && o.PushedToFulfillmentAt < thisWeekStart && o.PushedToFulfillmentAt >= lastWeekStart);

        // 4. Total Fulfillment Cost (Cost of delivered/completed orders)
        var costOrdersThisWeek = await _context.Orders
            .Include(o => o.Allocations).ThenInclude(a => a.Batch).ThenInclude(b => b.Item)
            .Include(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Where(o => o.TenantId == tenantId && o.Status >= OrderStatus.Packed && o.PushedToFulfillmentAt >= thisWeekStart)
            .ToListAsync();

        decimal currentCost = costOrdersThisWeek.Sum(o => o.Allocations.Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)));
        
        var costItems = costOrdersThisWeek
            .OrderByDescending(o => o.Allocations.Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)))
            .Take(10)
            .Select(o => new StatItemDto {
                Id = $"ORD-{o.OrderId}",
                Title = o.SupplyRequest != null && o.SupplyRequest.Branch != null ? o.SupplyRequest.Branch.Name : "HQ",
                Subtitle = $"Cost: ₱{o.Allocations.Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)):N2}",
                Date = o.PushedToFulfillmentAt
            })
            .ToList();

        var costOrdersLastWeek = await _context.Orders
            .Include(o => o.Allocations).ThenInclude(a => a.Batch).ThenInclude(b => b.Item)
            .Where(o => o.TenantId == tenantId && o.Status >= OrderStatus.Packed && o.PushedToFulfillmentAt < thisWeekStart && o.PushedToFulfillmentAt >= lastWeekStart)
            .ToListAsync();

        decimal lastWeekCost = costOrdersLastWeek.Sum(o => o.Allocations.Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)));

        return new OrderProcessingStatsDto
        {
            PendingFulfillment = CalculateMetric(currentPendingCount, lastWeekPending, pendingItems),
            OrdersPicking = CalculateMetric(currentPickingCount, lastWeekPicking, pickingItems),
            InTransit = CalculateMetric(currentTransitCount, lastWeekTransit, transitItems),
            TotalFulfillmentCost = CalculateMetric(currentCost, lastWeekCost, costItems)
        };
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

    public async Task<ReturnStatsDto> GetReturnStatsAsync(int? branchId = null)
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        // 1. Total Returns (All time display, weekly trend)
        var totalReturnsQuery = _context.Returns
            .Include(r => r.Branch)
            .Where(r => r.TenantId == tenantId && r.Status != ReturnStatus.Draft);
        
        if (branchId.HasValue)
        {
            totalReturnsQuery = totalReturnsQuery.Where(r => r.BranchId == branchId.Value);
        }

        var totalReturnsList = await totalReturnsQuery
            .OrderByDescending(r => r.LoggedAt)
            .ToListAsync();

        var totalItems = totalReturnsList.Take(10).Select(r => new StatItemDto {
            Id = r.TransactionCode ?? $"RT-{r.ReturnId}",
            Title = r.Branch?.Name ?? "Unknown Branch",
            Subtitle = $"Status: {r.Status}",
            Date = r.LoggedAt
        }).ToList();

        int currentTotalCount = totalReturnsList.Count;
        int lastWeekTotalCountSnapshot = totalReturnsList.Count(r => r.LoggedAt < thisWeekStart);

        // 2. Awaiting Action (Submitted, Acknowledged, Inspecting)
        var awaitingStatuses = new[] { ReturnStatus.Submitted, ReturnStatus.Acknowledged, ReturnStatus.Inspecting };
        var awaitingList = totalReturnsList.Where(r => awaitingStatuses.Contains(r.Status)).ToList();
        
        var awaitingItems = awaitingList.Take(10).Select(r => new StatItemDto {
            Id = r.TransactionCode ?? $"RT-{r.ReturnId}",
            Title = r.Branch?.Name ?? "Unknown Branch",
            Subtitle = $"Status: {r.Status}",
            Date = r.LoggedAt
        }).ToList();

        var lastWeekAwaitingQuery = _context.Returns
            .Where(r => r.TenantId == tenantId && awaitingStatuses.Contains(r.Status) && r.LoggedAt >= lastWeekStart && r.LoggedAt < thisWeekStart);

        if (branchId.HasValue)
        {
            lastWeekAwaitingQuery = lastWeekAwaitingQuery.Where(r => r.BranchId == branchId.Value);
        }

        int lastWeekAwaiting = await lastWeekAwaitingQuery.CountAsync();

        // 3. In Transit / Arrived
        var transitStatuses = new[] { ReturnStatus.Dispatched, ReturnStatus.Arrived };
        var transitList = totalReturnsList.Where(r => transitStatuses.Contains(r.Status)).ToList();

        var transitItems = transitList.Take(10).Select(r => new StatItemDto {
            Id = r.TransactionCode ?? $"RT-{r.ReturnId}",
            Title = r.Branch?.Name ?? "Unknown Branch",
            Subtitle = $"Status: {r.Status}",
            Date = r.LoggedAt
        }).ToList();

        var lastWeekTransitQuery = _context.Returns
            .Where(r => r.TenantId == tenantId && transitStatuses.Contains(r.Status) && r.LoggedAt >= lastWeekStart && r.LoggedAt < thisWeekStart);

        if (branchId.HasValue)
        {
            lastWeekTransitQuery = lastWeekTransitQuery.Where(r => r.BranchId == branchId.Value);
        }

        int lastWeekTransit = await lastWeekTransitQuery.CountAsync();

        // 4. Completed
        var completedList = totalReturnsList.Where(r => r.Status == ReturnStatus.Completed).ToList();

        var completedItems = completedList.Take(10).Select(r => new StatItemDto {
            Id = r.TransactionCode ?? $"RT-{r.ReturnId}",
            Title = r.Branch?.Name ?? "Unknown Branch",
            Subtitle = $"Resolution: {r.Resolution}",
            Date = r.LoggedAt
        }).ToList();

        var lastWeekCompletedQuery = _context.Returns
            .Where(r => r.TenantId == tenantId && r.Status == ReturnStatus.Completed && r.LoggedAt >= lastWeekStart && r.LoggedAt < thisWeekStart);

        if (branchId.HasValue)
        {
            lastWeekCompletedQuery = lastWeekCompletedQuery.Where(r => r.BranchId == branchId.Value);
        }

        int lastWeekCompleted = await lastWeekCompletedQuery.CountAsync();

        return new ReturnStatsDto
        {
            TotalReturns = CalculateMetric(currentTotalCount, lastWeekTotalCountSnapshot, totalItems),
            AwaitingAction = CalculateMetric(awaitingList.Count, lastWeekAwaiting, awaitingItems),
            InTransitOrArrived = CalculateMetric(transitList.Count, lastWeekTransit, transitItems),
            Completed = CalculateMetric(completedList.Count, lastWeekCompleted, completedItems)
        };
    }

    public async Task<BranchStatsDto> GetBranchStatsAsync()
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        var allBranches = await _context.Branches
            .Where(b => b.TenantId == tenantId)
            .ToListAsync();

        // 1. Monitored (Active)
        var activeBranches = allBranches.Where(b => b.IsActive).ToList();
        var monitoredItems = activeBranches.Take(10).Select(b => new StatItemDto {
            Id = $"BR-{b.BranchId}",
            Title = b.Name,
            Subtitle = b.Location ?? "No Location",
            Date = b.CreatedAt
        }).ToList();

        // 2. Total Branches
        var totalItems = allBranches.Take(10).Select(b => new StatItemDto {
            Id = $"BR-{b.BranchId}",
            Title = b.Name,
            Subtitle = b.IsActive ? "Active" : "Inactive",
            Date = b.CreatedAt
        }).ToList();

        // 3. Inactive
        var inactiveBranches = allBranches.Where(b => !b.IsActive).ToList();
        var inactiveItems = inactiveBranches.Take(10).Select(b => new StatItemDto {
            Id = $"BR-{b.BranchId}",
            Title = b.Name,
            Subtitle = "In Setup / Inactive",
            Date = b.CreatedAt
        }).ToList();

        // 4. Branches Low on Stock
        // We need to check batches for each branch
        var lowStockBranchIds = await _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == tenantId && b.BranchId != null)
            .GroupBy(b => b.BranchId)
            .Select(g => new { 
                BranchId = g.Key!.Value, 
                LowStock = g.Any(b => b.CurrentQuantity <= (b.Item != null ? b.Item.DefaultThreshold : 10)) 
            })
            .Where(x => x.LowStock)
            .Select(x => x.BranchId)
            .ToListAsync();

        var lowStockBranches = allBranches.Where(b => lowStockBranchIds.Contains(b.BranchId)).ToList();
        var lowStockItems = lowStockBranches.Take(10).Select(b => new StatItemDto {
            Id = $"BR-{b.BranchId}",
            Title = b.Name,
            Subtitle = "Needs Stock Attention",
            Date = DateTime.UtcNow // Placeholder
        }).ToList();

        // Trends (comparing against last week's count if we have that data, but here we'll just compare snapshots)
        // Since we don't have historical branch snapshots, we'll compare current vs created before last week.
        int lastWeekTotal = allBranches.Count(b => b.CreatedAt < thisWeekStart);
        int lastWeekActive = activeBranches.Count(b => b.CreatedAt < thisWeekStart);
        int lastWeekInactive = inactiveBranches.Count(b => b.CreatedAt < thisWeekStart);
        
        // For low stock, we don't have historical data easily, so we'll just show 0% change or estimate
        int lastWeekLowStock = lowStockBranches.Count; // Placeholder

        return new BranchStatsDto
        {
            MonitoredBranches = CalculateMetric(activeBranches.Count, lastWeekActive, monitoredItems),
            TotalBranches = CalculateMetric(allBranches.Count, lastWeekTotal, totalItems),
            InactiveBranches = CalculateMetric(inactiveBranches.Count, lastWeekInactive, inactiveItems),
            BranchesLowOnStock = CalculateMetric(lowStockBranches.Count, lastWeekLowStock, lowStockItems)
        };
    }

    public async Task<InventoryStatsDto> GetInventoryStatsAsync(int? branchId = null)
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        // Inventory refers to batches for the specific branch or HQ (null)
        var batches = await _context.Batches
            .Include(b => b.Item)
            .Where(b => b.TenantId == tenantId && b.BranchId == branchId)
            .ToListAsync();

        // 1. Total Active SKUs
        var activeSkus = batches.Select(b => b.Item).DistinctBy(i => i!.ItemId).ToList();
        var skuItems = activeSkus.Take(10).Select(i => new StatItemDto {
            Id = i!.SKU ?? $"SKU-{i.ItemId}",
            Title = i.Name,
            Subtitle = $"{batches.Where(b => b.ItemId == i.ItemId).Sum(b => b.CurrentQuantity)} {i.Unit} in stock",
            Date = i.CreatedAt
        }).ToList();

        // 2. Low Stock Alerts
        var lowStockBatches = batches.Where(b => b.CurrentQuantity <= (b.Item?.DefaultThreshold ?? 10)).ToList();
        var lowStockItems = lowStockBatches.Take(10).Select(b => new StatItemDto {
            Id = b.BatchNumber ?? $"BT-{b.BatchId}",
            Title = b.Item?.Name ?? "Unknown Item",
            Subtitle = $"Stock: {b.CurrentQuantity} (Threshold: {b.Item?.DefaultThreshold ?? 10})",
            Date = b.ExpiryDate
        }).ToList();

        // 3. Pending Restocks
        List<StatItemDto> pendingItems;
        int pendingCount;
        int lastWeekPending;

        if (branchId.HasValue)
        {
            // For branches, pending restocks are their SupplyRequests not yet fulfilled
            var pendingRequests = await _context.SupplyRequests
                .Where(r => r.TenantId == tenantId && r.BranchId == branchId && r.Status != SupplyRequestStatus.Fulfilled && r.Status != SupplyRequestStatus.Cancelled)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            pendingCount = pendingRequests.Count;
            pendingItems = pendingRequests.Take(10).Select(r => new StatItemDto {
                Id = r.ReferenceNumber ?? $"REQ-{r.RequestId}",
                Title = "Supply Request",
                Subtitle = $"Status: {r.Status}",
                Date = r.CreatedAt
            }).ToList();
            lastWeekPending = pendingRequests.Count(r => r.CreatedAt < thisWeekStart);
        }
        else
        {
            // For HQ, pending restocks are Orders with no RequestId (supplier orders)
            var pendingOrders = await _context.Orders
                .Where(o => o.TenantId == tenantId && o.RequestId == 0 && o.Status < OrderStatus.Arrived)
                .OrderByDescending(o => o.PushedToFulfillmentAt)
                .ToListAsync();

            pendingCount = pendingOrders.Count;
            pendingItems = pendingOrders.Take(10).Select(o => new StatItemDto {
                Id = $"ORD-{o.OrderId}",
                Title = "Supplier Order",
                Subtitle = $"Status: {o.Status}",
                Date = o.PushedToFulfillmentAt
            }).ToList();
            lastWeekPending = pendingOrders.Count(o => o.PushedToFulfillmentAt < thisWeekStart);
        }

        // 4. Inventory Value
        decimal totalValue = batches.Sum(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0));
        
        // Trends
        int lastWeekSkus = activeSkus.Count(i => i!.CreatedAt < thisWeekStart);
        int lastWeekLowStock = 0; 
        decimal lastWeekValue = totalValue; 

        return new InventoryStatsDto
        {
            TotalActiveSkus = CalculateMetric(activeSkus.Count, lastWeekSkus, skuItems),
            LowStockAlerts = CalculateMetric(lowStockBatches.Count, lastWeekLowStock, lowStockItems),
            PendingRestocks = CalculateMetric(pendingCount, lastWeekPending, pendingItems),
            InventoryValue = CalculateMetric(totalValue, lastWeekValue, [])
        };
    }

    public async Task<MenuStatsDto> GetMenuStatsAsync()
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        var allItems = await _context.MenuItems
            .Where(m => m.TenantId == tenantId && !m.IsDeleted)
            .ToListAsync();

        // 1. Total Items
        var totalItemsBreakdown = allItems.Take(10).Select(m => new StatItemDto {
            Id = $"MNU-{m.MenuItemId}",
            Title = m.Name,
            Subtitle = $"Base Price: ₱{m.BasePrice:N2}",
            Date = m.CreatedAt
        }).ToList();

        // 2. Active
        var activeList = allItems.Where(m => m.Status == MenuItemStatus.Active).ToList();
        var activeItemsBreakdown = activeList.Take(10).Select(m => new StatItemDto {
            Id = $"MNU-{m.MenuItemId}",
            Title = m.Name,
            Subtitle = "Live in Branch Menus",
            Date = m.CreatedAt
        }).ToList();

        // 3. Inactive
        var inactiveList = allItems.Where(m => m.Status == MenuItemStatus.Inactive).ToList();
        var inactiveItemsBreakdown = inactiveList.Take(10).Select(m => new StatItemDto {
            Id = $"MNU-{m.MenuItemId}",
            Title = m.Name,
            Subtitle = "Disabled / Hidden",
            Date = m.CreatedAt
        }).ToList();

        // 4. Out of Stock
        // Logic: Check ingredients. If any ingredient has 0 quantity across all HQ batches.
        var hqBatchQuantities = await _context.Batches
            .Where(b => b.TenantId == tenantId && b.BranchId == null)
            .GroupBy(b => b.ItemId)
            .Select(g => new { ItemId = g.Key, TotalQty = g.Sum(b => b.CurrentQuantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.TotalQty);

        var menuWithIngredients = await _context.MenuItems
            .Include(m => m.Ingredients)
            .Where(m => m.TenantId == tenantId && !m.IsDeleted && m.Status == MenuItemStatus.Active)
            .ToListAsync();

        var outOfStockList = menuWithIngredients.Where(m => 
            m.Ingredients.Any(i => !hqBatchQuantities.ContainsKey(i.ItemId) || hqBatchQuantities[i.ItemId] <= 0)
        ).ToList();

        var outOfStockItemsBreakdown = outOfStockList.Take(10).Select(m => new StatItemDto {
            Id = $"MNU-{m.MenuItemId}",
            Title = m.Name,
            Subtitle = "Missing Ingredients in HQ",
            Date = DateTime.UtcNow
        }).ToList();

        // Trends
        int lastWeekTotal = allItems.Count(m => m.CreatedAt < thisWeekStart);
        int lastWeekActive = activeList.Count(m => m.CreatedAt < thisWeekStart);
        int lastWeekInactive = inactiveList.Count(m => m.CreatedAt < thisWeekStart);
        int lastWeekOutOfStock = 0; // Snapshot not available

        return new MenuStatsDto
        {
            TotalItems = CalculateMetric(allItems.Count, lastWeekTotal, totalItemsBreakdown),
            ActiveItems = CalculateMetric(activeList.Count, lastWeekActive, activeItemsBreakdown),
            InactiveItems = CalculateMetric(inactiveList.Count, lastWeekInactive, inactiveItemsBreakdown),
            OutOfStockItems = CalculateMetric(outOfStockList.Count, lastWeekOutOfStock, outOfStockItemsBreakdown)
        };
    }

    public async Task<StaffStatsDto> GetStaffStatsAsync()
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        var allStaff = await _context.Users
            .Include(u => u.Branch)
            .Where(u => u.TenantId == tenantId)
            .ToListAsync();

        // 1. Total Staff
        var totalItems = allStaff.Take(10).Select(u => new StatItemDto {
            Id = $"USR-{u.UserId}",
            Title = u.FullName,
            Subtitle = u.Role.ToString(),
            Date = u.CreatedAt
        }).ToList();

        // 2. Active Staff
        var activeList = allStaff.Where(u => u.Status == EmployeeStatus.Active && !u.IsDeleted).ToList();
        var activeItems = activeList.Take(10).Select(u => new StatItemDto {
            Id = $"USR-{u.UserId}",
            Title = u.FullName,
            Subtitle = u.Branch?.Name ?? "HQ",
            Date = u.CreatedAt
        }).ToList();

        // 3. Inactive Staff
        var inactiveList = allStaff.Where(u => u.Status == EmployeeStatus.Inactive && !u.IsDeleted).ToList();
        var inactiveItems = inactiveList.Take(10).Select(u => new StatItemDto {
            Id = $"USR-{u.UserId}",
            Title = u.FullName,
            Subtitle = "Currently Off-boarded",
            Date = u.CreatedAt
        }).ToList();

        // 4. Archived Staff
        var archivedList = allStaff.Where(u => u.Status == EmployeeStatus.Archived || u.IsDeleted).ToList();
        var archivedItems = archivedList.Take(10).Select(u => new StatItemDto {
            Id = $"USR-{u.UserId}",
            Title = u.FullName,
            Subtitle = "Historical Record",
            Date = u.DeletedAt ?? u.CreatedAt
        }).ToList();

        // Trends
        int lastWeekTotal = allStaff.Count(u => u.CreatedAt < thisWeekStart);
        int lastWeekActive = activeList.Count(u => u.CreatedAt < thisWeekStart);
        int lastWeekInactive = inactiveList.Count(u => u.CreatedAt < thisWeekStart);
        int lastWeekArchived = archivedList.Count(u => u.CreatedAt < thisWeekStart);

        return new StaffStatsDto
        {
            TotalStaff = CalculateMetric(allStaff.Count, lastWeekTotal, totalItems),
            ActiveStaff = CalculateMetric(activeList.Count, lastWeekActive, activeItems),
            InactiveStaff = CalculateMetric(inactiveList.Count, lastWeekInactive, inactiveItems),
            ArchivedStaff = CalculateMetric(archivedList.Count, lastWeekArchived, archivedItems)
        };
    }

    public async Task<AuditStatsDto> GetAuditStatsAsync()
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        var allLogs = await _context.AuditLogs
            .Where(l => l.TenantId == tenantId)
            .ToListAsync();

        // 1. Total Events
        int currentTotal = allLogs.Count;
        int lastWeekTotal = allLogs.Count(l => l.OccurredAt < thisWeekStart);

        // 2. Created Events
        var createdActions = new[] { "Created", "Register", "Add" };
        int currentCreated = allLogs.Count(l => createdActions.Any(a => l.Action.Contains(a, StringComparison.OrdinalIgnoreCase)));
        int lastWeekCreated = allLogs.Count(l => l.OccurredAt < thisWeekStart && createdActions.Any(a => l.Action.Contains(a, StringComparison.OrdinalIgnoreCase)));

        // 3. Active Users (Actors) this week vs last week
        var currentUsers = allLogs.Where(l => l.OccurredAt >= thisWeekStart).Select(l => l.UserId).Distinct().Count();
        var lastWeekUsers = allLogs.Where(l => l.OccurredAt >= lastWeekStart && l.OccurredAt < thisWeekStart).Select(l => l.UserId).Distinct().Count();

        // 4. Archival/Inactive Events
        var archiveActions = new[] { "Archive", "Delete", "Inactivate" };
        int currentArchived = allLogs.Count(l => archiveActions.Any(a => l.Action.Contains(a, StringComparison.OrdinalIgnoreCase)));
        int lastWeekArchived = allLogs.Count(l => l.OccurredAt < thisWeekStart && archiveActions.Any(a => l.Action.Contains(a, StringComparison.OrdinalIgnoreCase)));

        return new AuditStatsDto
        {
            TotalEvents = CalculateMetric(currentTotal, lastWeekTotal, []),
            CreatedEvents = CalculateMetric(currentCreated, lastWeekCreated, []),
            ActiveUsers = CalculateMetric(currentUsers, lastWeekUsers, []),
            ArchivalEvents = CalculateMetric(currentArchived, lastWeekArchived, [])
        };
    }

    public async Task<FinanceStatsDto> GetFinanceStatsAsync()
    {
        var tenantId = RequireTenantId();
        var now = DateTime.UtcNow;
        var thisWeekStart = now.AddDays(-7);
        var lastWeekStart = now.AddDays(-14);

        // 1. Total Fulfillment Cost (Delivered/Completed Orders)
        var allAllocations = await _context.OrderAllocations
            .Include(a => a.Batch).ThenInclude(b => b.Item)
            .Include(a => a.Order).ThenInclude(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Where(a => a.TenantId == tenantId && a.Order != null && (a.Order.Status == OrderStatus.Delivered || a.Order.Status == OrderStatus.Completed))
            .ToListAsync();

        var currentFulfillmentCost = allAllocations.Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0));
        var lastWeekFulfillmentCost = allAllocations
            .Where(a => a.Order?.PushedToFulfillmentAt < thisWeekStart)
            .Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0));

        var fulfillmentItems = allAllocations
            .GroupBy(a => a.OrderId)
            .OrderByDescending(g => g.First().Order?.PushedToFulfillmentAt)
            .Take(10)
            .Select(g => new StatItemDto {
                Id = $"ORD-{g.Key}",
                Title = g.First().Order?.SupplyRequest?.Branch?.Name ?? "HQ",
                Subtitle = $"Cost: ₱{g.Sum(a => a.QuantityPicked * (a.Batch?.Item?.UnitCost ?? 0)):N0}",
                Date = g.First().Order?.PushedToFulfillmentAt
            }).ToList();

        // 2. Chain Inventory Value
        var allBatches = await _context.Batches
            .Include(b => b.Item)
            .Include(b => b.Branch)
            .Where(b => b.TenantId == tenantId && b.CurrentQuantity > 0)
            .ToListAsync();

        var currentInventoryValue = allBatches.Sum(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0));
        var lastWeekInventoryValue = allBatches
            .Where(b => b.CreatedAt < thisWeekStart)
            .Sum(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0));

        var inventoryItems = allBatches
            .OrderByDescending(b => b.CurrentQuantity * (b.Item?.UnitCost ?? 0))
            .Take(10)
            .Select(b => new StatItemDto {
                Id = $"BATCH-{b.BatchId}",
                Title = b.Item?.Name ?? "Unknown Item",
                Subtitle = $"Value: ₱{(b.CurrentQuantity * (b.Item?.UnitCost ?? 0)):N0} @ {b.Branch?.Name ?? "HQ"}",
                Date = b.CreatedAt
            }).ToList();

        // 3. Total Wastage Loss (Spoilage + Adjustment)
        var allLogs = await _context.ConsumptionLogItems
            .Include(i => i.Item)
            .Include(i => i.ConsumptionLog).ThenInclude(l => l != null ? l.Branch : null)
            .Where(i => i.TenantId == tenantId && i.ConsumptionLog != null && (i.ConsumptionLog.Method == ConsumptionMethod.Spoilage || i.ConsumptionLog.Method == ConsumptionMethod.Adjustment))
            .ToListAsync();

        var currentWastageLoss = allLogs.Sum(i => i.Quantity * (i.Item?.UnitCost ?? 0));
        var lastWeekWastageLoss = allLogs
            .Where(i => i.ConsumptionLog?.LogDate < thisWeekStart)
            .Sum(i => i.Quantity * (i.Item?.UnitCost ?? 0));

        var wastageItems = allLogs
            .OrderByDescending(i => i.Quantity * (i.Item?.UnitCost ?? 0))
            .Take(10)
            .Select(i => new StatItemDto {
                Id = $"LOG-{i.ConsumptionLogItemId}",
                Title = i.Item?.Name ?? "Unknown Item",
                Subtitle = $"Loss: ₱{(i.Quantity * (i.Item?.UnitCost ?? 0)):N0} ({i.ConsumptionLog?.Method})",
                Date = i.ConsumptionLog?.LogDate
            }).ToList();

        // 4. Returns Credit Loss
        var allReturns = await _context.Returns
            .Include(r => r.Branch)
            .Where(r => r.TenantId == tenantId && r.Status == ReturnStatus.Completed)
            .ToListAsync();

        var currentReturnLoss = allReturns.Sum(r => r.TotalLossValue);
        var lastWeekReturnLoss = allReturns
            .Where(r => r.CompletedAt < thisWeekStart)
            .Sum(r => r.TotalLossValue);

        var returnItems = allReturns
            .OrderByDescending(r => r.TotalLossValue)
            .Take(10)
            .Select(r => new StatItemDto {
                Id = $"RET-{r.ReturnId}",
                Title = r.Branch?.Name ?? "HQ",
                Subtitle = $"Credit Loss: ₱{r.TotalLossValue:N0}",
                Date = r.CompletedAt
            }).ToList();

        return new FinanceStatsDto
        {
            TotalFulfillmentCost = CalculateMetric((int)currentFulfillmentCost, (int)lastWeekFulfillmentCost, fulfillmentItems),
            ChainInventoryValue = CalculateMetric((int)currentInventoryValue, (int)lastWeekInventoryValue, inventoryItems),
            TotalWastageLoss = CalculateMetric((int)currentWastageLoss, (int)lastWeekWastageLoss, wastageItems),
            ReturnsCreditLoss = CalculateMetric((int)currentReturnLoss, (int)lastWeekReturnLoss, returnItems)
        };
    }
}
