namespace Kettan.Server.Enums;

public enum OrderStatus : byte
{
    Pending = 0,
    Processing = 0,             // Alias for Pending
    Allocated = 1,
    Picking = 1,                // Alias for Allocated
    Packed = 2,
    Packing = 2,                // Alias for Packed
    Dispatched = 3,
    InTransit = 4,
    Delivered = 5,
    DeliveredWithVariance = 5,  // Alias for Delivered
    Cancelled = 6,
    Returned = 7,
    Arrived = 8,                // Branch confirmed package arrived
    Completed = 9,              // Branch completed final check
}
