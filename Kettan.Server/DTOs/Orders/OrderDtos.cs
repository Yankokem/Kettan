namespace Kettan.Server.DTOs.Orders;

public class BranchOrderDto
{
    public int OrderId { get; set; }
    public int RequestId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PushedToFulfillmentAt { get; set; }
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
