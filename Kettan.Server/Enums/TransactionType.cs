namespace Kettan.Server.Enums;

public enum TransactionType : byte
{
    StockIn = 0,
    Restock = 0,            // Alias for StockIn
    StockOut = 1,
    Adjustment = 2,
    PhysicalCount = 2,      // Alias for Adjustment
    Spoilage = 3,
    WriteOff = 3,           // Alias for Spoilage
    Transfer = 4,
    ReturnDispatch = 4,     // Alias for Transfer
    Return = 5,
    SalesAuto = 1,          // Alias for StockOut
    Consumption = 1,        // Alias for StockOut
    OrderFulfillment = 1    // Alias for StockOut
}
