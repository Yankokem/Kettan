namespace Kettan.Server.Enums;

public enum PaymentStatus : byte
{
    Pending = 0,
    Paid = 1,
    Failed = 2,
    Refunded = 3
}
