namespace Kettan.Server.Enums;

public enum OrderStatus : byte
{
    Pending = 0,
    Processing = 0,             // Alias for Pending
    Allocated = 1,
    Picking = 1,                // Alias for Allocated
    Packed = 2,
    Dispatched = 3,
    InTransit = 4,
    Delivered = 5,
    DeliveredWithVariance = 5,  // Alias for Delivered
    Cancelled = 6,
    Returned = 7
}
