namespace Kettan.Server.DTOs.Orders;

public class BranchOrderDto
{
    public int OrderId { get; set; }
    public int RequestId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PushedToFulfillmentAt { get; set; }
    public int ItemsCount { get; set; }
    public decimal FulfillmentCost { get; set; }
}

public class OrderRequestItemDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityRequested { get; set; }
    public decimal? QuantityApproved { get; set; }
    public decimal UnitCost { get; set; }
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
    public int? CourierId { get; set; }
    public int? VehicleId { get; set; }
    public DateTime? DispatchDate { get; set; }
    public DateTime? EstimatedArrival { get; set; }
    public List<OrderRequestItemDto> RequestedItems { get; set; } = [];
    public List<OrderAllocationDto> Allocations { get; set; } = [];
}

public class CreateOrderItemDto
{
    public int ItemId { get; set; }
    public decimal QuantityRequested { get; set; }
}

public class CreateOrderDto
{
    public int BranchId { get; set; }
    public string RequestType { get; set; } = "hq_initiated";
    public string Priority { get; set; } = "normal";
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = [];
}

public class UpdateOrderStatusDto
{
    public string? Remarks { get; set; }
}

public class DispatchOrderDto
{
    public int? CourierId { get; set; }
    public int? VehicleId { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? EstimatedArrival { get; set; }
    public string? Remarks { get; set; }
}

public class ConfirmDeliveryLineDto
{
    public int ItemId { get; set; }
    public decimal QuantityReceived { get; set; }
}

public class ConfirmDeliveryDto
{
    public bool ReceivedInFull { get; set; } = true;
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
