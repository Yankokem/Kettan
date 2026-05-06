namespace Kettan.Server.DTOs.Analytics;

// ── Existing DTOs (unchanged) ────────────────────────────────────────────────

public class InventorySummaryDto
{
    public int TotalSkus { get; set; }
    public decimal TotalVolume { get; set; }
    public decimal TotalValuation { get; set; }
}

public class OrderFulfillmentMetricsDto
{
    public int TotalOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public decimal FulfillmentRate { get; set; }
    public decimal TotalFulfillmentCost { get; set; }
}

public class BranchScorecardDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public decimal ScorePercentage { get; set; }
    public int SalesVolume { get; set; }
    public int ReturnsCount { get; set; }
    public int SupplyRequestsCount { get; set; }
}

public class ConsumptionTrendDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public decimal TotalConsumptionVolume { get; set; }
    public int LogCount { get; set; }
}

public class EoqResultDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal EconomicOrderQuantity { get; set; }
    public decimal AnnualDemandUsed { get; set; }
}

// ── New DTOs ─────────────────────────────────────────────────────────────────

/// <summary>
/// HQ Overview — KPI cards data
/// </summary>
public class HqOverviewDto
{
    public decimal TotalFulfillmentCost { get; set; }
    public decimal TotalChainInventoryValue { get; set; }
    public decimal TotalWastageLoss { get; set; }
    public decimal TotalReturnLoss { get; set; }
    public string TopPerformerName { get; set; } = string.Empty;
    public decimal TopPerformerScore { get; set; }
    public decimal FulfillmentRate { get; set; }
    public int TotalOrders { get; set; }
}

/// <summary>
/// A single point in a cost-over-time chart (monthly)
/// </summary>
public class CostTrendPointDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Label { get; set; } = string.Empty;   // e.g. "Jan 2026"
    public decimal FulfillmentCost { get; set; }
    public decimal ShippingCost { get; set; }
}

/// <summary>
/// Supply spend per branch (for bar chart)
/// </summary>
public class BranchSpendDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public decimal TotalSpend { get; set; }
}

/// <summary>
/// Inventory valuation per branch
/// </summary>
public class BranchInventoryValuationDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int TotalSkus { get; set; }
    public decimal TotalVolume { get; set; }
    public decimal TotalValuation { get; set; }
}

/// <summary>
/// Wastage / spoilage line item
/// </summary>
public class WastageRecordDto
{
    public int TransactionId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityLost { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalLoss { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string LoggedByName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// EOQ suggestion row for the table
/// </summary>
public class EoqSuggestionDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal AnnualDemand { get; set; }
    public decimal EOQ { get; set; }
    public decimal UnitCost { get; set; }
    public decimal SetupCost { get; set; }
    public decimal HoldingCost { get; set; }
}

/// <summary>
/// Returns & Losses overview
/// </summary>
public class ReturnsLossOverviewDto
{
    public int TotalReturns { get; set; }
    public int ReplacedCount { get; set; }
    public int CreditedCount { get; set; }
    public int RejectedCount { get; set; }
    public decimal TotalMoneyLost { get; set; }         // Credited returns = money lost
    public decimal AverageReturnRate { get; set; }      // returns / total orders
}

/// <summary>
/// Return record enriched with cost data
/// </summary>
public class ReturnLossRecordDto
{
    public int ReturnId { get; set; }
    public int OrderId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Resolution { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal CreditAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime LoggedAt { get; set; }
}

/// <summary>
/// Consumption analytics — top menu item
/// </summary>
public class TopMenuItemDto
{
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    public int LogCount { get; set; }
}

/// <summary>
/// Consumption analytics — ingredient usage
/// </summary>
public class IngredientUsageDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal TotalConsumed { get; set; }
}

/// <summary>
/// Consumption analytics — shift breakdown
/// </summary>
public class ShiftBreakdownDto
{
    public string Shift { get; set; } = string.Empty;   // Morning / Afternoon / Evening / null→"Unspecified"
    public int LogCount { get; set; }
    public decimal TotalVolume { get; set; }
}

/// <summary>
/// Full consumption analytics response
/// </summary>
public class ConsumptionAnalyticsDto
{
    public List<TopMenuItemDto> TopMenuItems { get; set; } = [];
    public List<IngredientUsageDto> IngredientUsage { get; set; } = [];
    public List<ShiftBreakdownDto> ShiftBreakdown { get; set; } = [];
}

// ── Branch-scoped DTOs ───────────────────────────────────────────────────────

/// <summary>
/// Branch overview KPIs (branch user's own data)
/// </summary>
public class BranchOverviewDto
{
    public decimal InventoryValue { get; set; }
    public int TotalSkus { get; set; }
    public decimal TotalSupplySpendReceived { get; set; }
    public decimal WastageLoss { get; set; }
    public decimal PerformanceScore { get; set; }
    public int RankInChain { get; set; }
    public int TotalBranchesInChain { get; set; }
}

/// <summary>
/// Branch supply history record
/// </summary>
public class BranchSupplyHistoryDto
{
    public int RequestId { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public decimal FulfillmentCost { get; set; }
    public bool IsFullyFulfilled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}

/// <summary>
/// Branch performance breakdown (their own weighted score components)
/// </summary>
public class BranchPerformanceDetailDto
{
    public decimal WeightedScore { get; set; }
    public decimal FulfillmentRate { get; set; }       // 30%
    public decimal ReturnRate { get; set; }             // 20%
    public decimal DeliverySpeedHrs { get; set; }       // 25%
    public decimal StockAccuracy { get; set; }          // 25%
    public int RankInChain { get; set; }
    public int TotalBranches { get; set; }
}

// ── Dashboard Trend DTOs ─────────────────────────────────────────────────────

public class TrendPointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class BranchTrendDto
{
    public string BranchName { get; set; } = string.Empty;
    public List<TrendPointDto> Points { get; set; } = new();
}

public class LowStockAlertDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal Threshold { get; set; }
    public string Unit { get; set; } = string.Empty;
}