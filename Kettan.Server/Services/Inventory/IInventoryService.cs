namespace Kettan.Server.Services.Inventory;

public class StockInResult
{
    public int BatchId { get; set; }
    public int ItemId { get; set; }
    public int? BranchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public decimal QuantityAdded { get; set; }
    public decimal CurrentQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FifoDeductionResult
{
    public int BatchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public decimal QuantityDeducted { get; set; }
    public decimal RemainingBatchQuantity { get; set; }
}

public class ThresholdAlertResult
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public int? BranchId { get; set; }
    public decimal StockLevel { get; set; }
    public decimal Threshold { get; set; }
}

public class StockTransferResult
{
    public int SourceBatchId { get; set; }
    public int TargetBatchId { get; set; }
    public int ItemId { get; set; }
    public int? FromBranchId { get; set; }
    public int ToBranchId { get; set; }
    public decimal QuantityTransferred { get; set; }
}

public interface IInventoryService
{
    Task<StockInResult> StockInAsync(int itemId, decimal quantity, string batchNumber, DateTime expiryDate, string? remarks = null);
    Task<List<FifoDeductionResult>> StockOutAsync(int itemId, decimal quantity, string reason, string? remarks = null);
    Task<List<FifoDeductionResult>> DeductFifoAsync(
        int itemId,
        int? branchId,
        decimal quantity,
        string transactionType,
        string? remarks = null,
        string? referenceType = null,
        int? referenceId = null);
    Task<decimal> GetStockLevelAsync(int itemId, int? branchId = null);
    Task<List<ThresholdAlertResult>> CheckThresholdsAsync(int? branchId = null);
    Task<StockTransferResult> TransferToBranchAsync(int batchId, int branchId, decimal quantity, string? remarks = null);
}
