namespace Kettan.Server.DTOs.Couriers;

public class CourierDto
{
    public int CourierId { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCourierDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public bool IsActive { get; set; } = true;
}

public class VehicleDto
{
    public int VehicleId { get; set; }
    public int TenantId { get; set; }
    public int CourierId { get; set; }
    public string CourierName { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVehicleDto
{
    public int CourierId { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
