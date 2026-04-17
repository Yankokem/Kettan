namespace Kettan.Server.DTOs.SupplyRequests;

public class SupplyRequestItemDto
{
    public int RequestItemId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityRequested { get; set; }
    public decimal? QuantityApproved { get; set; }
}

public class SupplyRequestDto
{
    public int RequestId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RequestType { get; set; } = "manual";
    public string Priority { get; set; } = "normal";
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SupplyRequestItemDto> Items { get; set; } = [];
}

public class CreateSupplyRequestItemDto
{
    public int ItemId { get; set; }
    public decimal QuantityRequested { get; set; }
}

public class CreateSupplyRequestDto
{
    public int? BranchId { get; set; }
    public string RequestType { get; set; } = "manual";
    public string Priority { get; set; } = "normal";
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateSupplyRequestItemDto> Items { get; set; } = [];
}

public class SubmitSupplyRequestDto
{
    public string? Notes { get; set; }
}
