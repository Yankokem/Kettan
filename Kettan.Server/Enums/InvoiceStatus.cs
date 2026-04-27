namespace Kettan.Server.Enums;

public enum InvoiceStatus : byte
{
    Draft = 0,
    Issued = 1,
    Paid = 2,
    Overdue = 3,
    Void = 4,
    Pending = 5,
    Failed = 5      // Alias for Pending
}
