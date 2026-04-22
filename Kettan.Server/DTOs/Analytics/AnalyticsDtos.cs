namespace Kettan.Server.DTOs.Analytics;

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
