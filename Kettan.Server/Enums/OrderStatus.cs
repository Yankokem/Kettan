namespace Kettan.Server.Enums;

public enum OrderStatus : byte
{
    Pending = 0,
    Processing = 1,
    Picking = 2,
    Packing = 3,
    Packed = 4,
    Dispatched = 5,
    InTransit = 6,
    Arrived = 7,
    Completed = 8,
    Cancelled = 9,
    Returned = 10,
    Delivered = 11,
    DeliveredWithVariance = 12
}
