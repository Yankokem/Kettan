using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Orders;

public class BranchOrderDto
{
    public string TransactionCode { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public int RequestId { get; set; }
    public string? Subject { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DispatchScheduleStatus { get; set; } = "NoSchedule";
    public DateTime PushedToFulfillmentAt { get; set; }
    public int ItemsCount { get; set; }
    public decimal TotalRequestedValue { get; set; }
    public decimal TotalApprovedValue { get; set; }
    public decimal TotalFulfilledValue { get; set; }
    public decimal FulfillmentCost { get; set; }
    public bool IsHqInitiated { get; set; }
    public string? DispatchReason { get; set; }
    public int? SupplyPushBatchId { get; set; }
    public string? SupplyPushBatchCode { get; set; }
}

public class OrderRequestItemDto
{
    public int RequestItemId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityRequested { get; set; }
    public decimal? QuantityApproved { get; set; }
    public decimal UnitCost { get; set; }

    // Workflow fields
    public bool IsPicked { get; set; }
    public decimal? SendQuantity { get; set; }
    public bool IsRejectedDuringPicking { get; set; }
    public string? PickingRejectionReason { get; set; }
    public bool IsPacked { get; set; }
    public bool IsBranchChecked { get; set; }
    public decimal? HqStock { get; set; }
    public decimal? BranchStock { get; set; }
}

public class OrderAllocationDto
{
    public int AllocationId { get; set; }
    public int BatchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal QuantityPicked { get; set; }
    public decimal RemainingBatchQuantity { get; set; }
}

public class OrderDetailDto : BranchOrderDto
{
    public string RequestStatus { get; set; } = string.Empty;
    public int RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? TrackingNumber { get; set; }

    public int? VehicleId { get; set; }
    public DateTime? DispatchDate { get; set; }
    public DateTime? EstimatedArrival { get; set; }

    public DateTime? ArrivedAt { get; set; }
    public string? ArrivedConfirmedByName { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedByName { get; set; }

    public List<OrderRequestItemDto> RequestedItems { get; set; } = [];
    public List<OrderAllocationDto> Allocations { get; set; } = [];
}

public class CreateOrderItemDto
{
    public int ItemId { get; set; }

    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity requested must be greater than zero.")]
    public decimal QuantityRequested { get; set; }
}

public class CreateOrderDto
{
    [Required]
    public int BranchId { get; set; }

    [StringLength(80)]
    public string? Subject { get; set; }

    [Required]
    [StringLength(20)]
    public string RequestType { get; set; } = "hq_initiated";

    [Required]
    [StringLength(20)]
    public string Priority { get; set; } = "normal";

    [Required]
    [StringLength(20)]
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = [];
}

public class UpdateOrderStatusDto
{
    [StringLength(500)]
    public string? Remarks { get; set; }
}

public class DispatchOrderDto
{
    public int? VehicleId { get; set; }

    [StringLength(100)]
    public string? TrackingNumber { get; set; }
    public DateTime? EstimatedArrival { get; set; }

    [StringLength(500)]
    public string? Remarks { get; set; }
}

public class ConfirmDeliveryLineDto
{
    public int ItemId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Quantity received cannot be negative.")]
    public decimal QuantityReceived { get; set; }
}

public class ConfirmDeliveryDto
{
    public bool ReceivedInFull { get; set; } = true;

    [StringLength(500)]
    public string? Remarks { get; set; }
    public List<ConfirmDeliveryLineDto> Lines { get; set; } = [];
}

public class OrderStatusHistoryDto
{
    public int HistoryId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? ChangedByUserId { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime Timestamp { get; set; }
}
