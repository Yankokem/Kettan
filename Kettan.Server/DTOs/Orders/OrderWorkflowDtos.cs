namespace Kettan.Server.DTOs.Orders;

// ── Picking Suggestions (Smart Qty Algorithm) ──

public class PickingSuggestionDto
{
    public int RequestItemId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal ApprovedQty { get; set; }
    public decimal HqStock { get; set; }
    public decimal BranchCurrentStock { get; set; }
    public decimal BranchThreshold { get; set; }
    public decimal SuggestedSendQty { get; set; }
}

// ── Picking Submit ──

public class PickingItemDto
{
    public int RequestItemId { get; set; }
    public bool IsPicked { get; set; }
    public decimal? SendQuantity { get; set; }
    public bool IsRejected { get; set; }
    public string? RejectionReason { get; set; }
}

public class PickingSubmitDto
{
    public List<PickingItemDto> Items { get; set; } = [];
}

// ── Packing Submit ──

public class PackingItemDto
{
    public int RequestItemId { get; set; }
    public bool IsPacked { get; set; }
}

public class PackingSubmitDto
{
    public List<PackingItemDto> Items { get; set; } = [];
}

// ── Branch Check Submit ──

public class BranchCheckItemDto
{
    public int RequestItemId { get; set; }
    public bool IsChecked { get; set; }
}

public class BranchCheckSubmitDto
{
    public List<BranchCheckItemDto> Items { get; set; } = [];
}
