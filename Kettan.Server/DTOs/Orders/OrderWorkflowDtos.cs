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
    public string? Remarks { get; set; }
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
    public string? Remarks { get; set; }
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
    public string? Remarks { get; set; }
}

// ── Confirm Arrival ──

public class ConfirmArrivalDto
{
    public string? Remarks { get; set; }
}

// ── Cancel Order ──

public class CancelOrderDto
{
    public string? Reason { get; set; }
}

// ── Order Messaging ──

public class OrderMessageDto
{
    public int MessageId { get; set; }
    public int OrderId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}

public class SendMessageDto
{
    public string Content { get; set; } = string.Empty;
}
