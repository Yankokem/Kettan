namespace Kettan.Server.DTOs.Items;

public class ItemDto
{
    public int ItemId { get; set; }
    public int TenantId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public string UnitSymbol { get; set; } = string.Empty;
    public int? InventoryCategoryId { get; set; }
    public string? InventoryCategoryName { get; set; }
    public int? ItemCategoryId { get; set; }
    public string? ItemCategoryName { get; set; }
    public decimal DefaultThreshold { get; set; }
    public decimal UnitCost { get; set; }
    public decimal? PreviousUnitCost { get; set; }
    public decimal? SellingPrice { get; set; }
    public bool IsBundle { get; set; }
    public string? ImageUrl { get; set; }
    public decimal TotalStock { get; set; }
    public bool IsLowStock { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ItemDetailDto : ItemDto
{
    public List<BatchDto> Batches { get; set; } = [];
}

public class CreateItemDto
{
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int UnitId { get; set; }
    public int? InventoryCategoryId { get; set; }
    public int? ItemCategoryId { get; set; }
    public decimal DefaultThreshold { get; set; }
    public decimal UnitCost { get; set; }
    public decimal? SellingPrice { get; set; }
    public bool IsBundle { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateItemDto
{
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int UnitId { get; set; }
    public int? InventoryCategoryId { get; set; }
    public int? ItemCategoryId { get; set; }
    public decimal DefaultThreshold { get; set; }
    public decimal UnitCost { get; set; }
    public decimal? SellingPrice { get; set; }
    public bool IsBundle { get; set; }
    public string? ImageUrl { get; set; }
}

public class StockInDto
{
    public decimal Quantity { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Remarks { get; set; }
}

public class StockOutDto
{
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = "Adjustment";
    public string? Remarks { get; set; }
}

public class BatchDto
{
    public int BatchId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public decimal CurrentQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransactionDto
{
    public int TransactionId { get; set; }
    public int BatchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal QuantityChange { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public string? Remarks { get; set; }
    public DateTime Timestamp { get; set; }
}

public class StockOutResultDto
{
    public decimal StockLevel { get; set; }
    public List<FifoBatchDeductionDto> Deductions { get; set; } = [];
}

public class FifoBatchDeductionDto
{
    public int BatchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public decimal QuantityDeducted { get; set; }
    public decimal RemainingBatchQuantity { get; set; }
}
