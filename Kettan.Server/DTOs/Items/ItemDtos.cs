using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Items;

public class ItemDto
{
    public int ItemId { get; set; }
    public int TenantId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int? InventoryCategoryId { get; set; }
    public string? InventoryCategoryName { get; set; }
    public int? ItemCategoryId { get; set; }
    public string? ItemCategoryName { get; set; }
    public int? SupplierId { get; set; }
    public List<int>? SupplierIds { get; set; }
    public string? SupplierName { get; set; }
    public decimal DefaultThreshold { get; set; }
    public decimal UnitCost { get; set; }
    public decimal? PreviousUnitCost { get; set; }
    public decimal? SellingPrice { get; set; }
    public bool IsBundle { get; set; }

    public decimal TotalStock { get; set; }
    public bool IsLowStock { get; set; }
    public bool IsBranchThreshold { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ItemDetailDto : ItemDto
{
    public List<BatchDto> Batches { get; set; } = [];
}

public class CreateItemDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string SKU { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 1)]
    public string Unit { get; set; } = string.Empty;

    public int? InventoryCategoryId { get; set; }
    public int? ItemCategoryId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Default threshold cannot be negative.")]
    public decimal DefaultThreshold { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Unit cost cannot be negative.")]
    public decimal UnitCost { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Selling price cannot be negative.")]
    public decimal? SellingPrice { get; set; }

    public bool IsBundle { get; set; }
    public int? SupplierId { get; set; }
}

public class UpdateItemDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string SKU { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 1)]
    public string Unit { get; set; } = string.Empty;

    public int? InventoryCategoryId { get; set; }
    public int? ItemCategoryId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Default threshold cannot be negative.")]
    public decimal DefaultThreshold { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Unit cost cannot be negative.")]
    public decimal UnitCost { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Selling price cannot be negative.")]
    public decimal? SellingPrice { get; set; }

    public bool IsBundle { get; set; }
    public int? SupplierId { get; set; }
}

public class StockInDto
{
    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    [Required]
    [StringLength(100)]
    public string BatchNumber { get; set; } = string.Empty;

    public DateTime ExpiryDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Unit cost cannot be negative.")]
    public decimal? UnitCost { get; set; }

    public int? SupplierId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Default threshold cannot be negative.")]
    public decimal? DefaultThreshold { get; set; }

    [StringLength(500)]
    public string? Remarks { get; set; }
}

public class StockOutDto
{
    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    [Required]
    [StringLength(100)]
    public string Reason { get; set; } = "Adjustment";

    [StringLength(500)]
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
    public string TransactionCode { get; set; } = string.Empty;
    public int TransactionId { get; set; }
    public int BatchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
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

public class SetBranchThresholdRequest
{
    public int ItemId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Threshold cannot be negative.")]
    public decimal Threshold { get; set; }
}
