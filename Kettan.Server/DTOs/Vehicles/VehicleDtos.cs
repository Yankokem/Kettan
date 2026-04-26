using System;

namespace Kettan.Server.DTOs.Vehicles;

public class VehicleDto
{
    public int VehicleId { get; set; }
    public int TenantId { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVehicleDto
{
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateVehicleDto
{
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
