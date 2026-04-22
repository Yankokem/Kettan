namespace Kettan.Server.DTOs.Returns;

public class ReturnItemDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal QuantityReturned { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ReturnDto
{
    public int ReturnId { get; set; }
    public int OrderId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Resolution { get; set; } = string.Empty;
    public string? PhotoUrls { get; set; }
    public decimal? CreditAmount { get; set; }
    public DateTime LoggedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<ReturnItemDto> Items { get; set; } = [];
}

public class CreateReturnItemDto
{
    public int ItemId { get; set; }
    public decimal QuantityReturned { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class CreateReturnDto
{
    public int OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? PhotoUrls { get; set; }
    public List<CreateReturnItemDto> Items { get; set; } = [];
}

public class ResolveReturnDto
{
    public string Resolution { get; set; } = "Pending";
    public decimal? CreditAmount { get; set; }
    public string? Remarks { get; set; }
}
