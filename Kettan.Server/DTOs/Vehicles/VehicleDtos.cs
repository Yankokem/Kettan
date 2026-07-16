using System;
using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Vehicles;

public class VehicleDto
{
    public int VehicleId { get; set; }
    public int TenantId { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVehicleDto
{
    [Required]
    [StringLength(50)]
    public string PlateNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string VehicleType { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateVehicleDto
{
    [Required]
    [StringLength(50)]
    public string PlateNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string VehicleType { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
