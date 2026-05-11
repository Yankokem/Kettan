namespace Kettan.Server.DTOs.Orders;

public class CreateMultiBranchSupplyPushItemDto
{
    public int ItemId { get; set; }
    public decimal QuantityRequested { get; set; }
}

public class CreateMultiBranchSupplyPushDto
{
    public List<int> BranchIds { get; set; } = [];
    public string? Subject { get; set; }
    public string RequestType { get; set; } = "hq_initiated";
    public string Priority { get; set; } = "normal";
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateMultiBranchSupplyPushItemDto> Items { get; set; } = [];
}

public class SupplyPushBatchItemDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityRequested { get; set; }
    public decimal UnitCostSnapshot { get; set; }
}

public class SupplyPushBatchStatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class MultiBranchSupplyPushDto
{
    public int SupplyPushBatchId { get; set; }
    public string TransactionCode { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string DispatchWindow { get; set; } = string.Empty;
    public DateTime? DispatchDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int TotalBranches { get; set; }
    public int CompletedBranches { get; set; }
    public int CancelledBranches { get; set; }
    public List<SupplyPushBatchStatusCountDto> StatusBreakdown { get; set; } = [];
}

public class MultiBranchSupplyPushDetailDto : MultiBranchSupplyPushDto
{
    public List<SupplyPushBatchItemDto> Items { get; set; } = [];
    public List<BranchOrderDto> BranchOrders { get; set; } = [];
}
