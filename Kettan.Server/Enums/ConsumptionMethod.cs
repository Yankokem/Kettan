namespace Kettan.Server.Enums;

public enum ConsumptionMethod : byte
{
    Sales = 0,
    Direct = 0,     // Alias for Sales
    Spoilage = 1,
    Manual = 2,
    Adjustment = 3
}
