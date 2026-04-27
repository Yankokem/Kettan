namespace Kettan.Server.Enums;

public enum ReferenceType : byte
{
    Order = 0,
    SupplyRequest = 1,
    ConsumptionLog = 2,
    Manual = 3,
    StockIn = 3,    // Alias for Manual
    StockOut = 3,   // Alias for Manual
    Return = 4,
    Branch = 4,     // Alias for Return
    Batch = 4       // Alias for Return
}
