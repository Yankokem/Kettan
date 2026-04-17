namespace Kettan.Server.DTOs.Consumption;

public class SalesConsumptionLineDto
{
    public int MenuItemId { get; set; }
    public int QuantitySold { get; set; }
}

public class LogSalesConsumptionDto
{
    public DateTime LogDate { get; set; }
    public string Shift { get; set; } = "Morning";
    public string? Remarks { get; set; }
    public List<SalesConsumptionLineDto> Sales { get; set; } = [];
}

public class DirectConsumptionLineDto
{
    public int ItemId { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = "Consumption";
}

public class LogDirectConsumptionDto
{
    public DateTime LogDate { get; set; }
    public string Shift { get; set; } = "Morning";
    public string? Remarks { get; set; }
    public List<DirectConsumptionLineDto> Items { get; set; } = [];
}

public class ConsumptionLogDto
{
    public int ConsumptionLogId { get; set; }
    public int BranchId { get; set; }
    public string Method { get; set; } = string.Empty;
    public string? Shift { get; set; }
    public DateTime LogDate { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
