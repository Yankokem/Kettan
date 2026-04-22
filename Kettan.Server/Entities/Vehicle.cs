using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Vehicle : ITenantEntity
{
    [Key]
    public int VehicleId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int CourierId { get; set; }

    [ForeignKey(nameof(CourierId))]
    public Courier? Courier { get; set; }

    [Required]
    [MaxLength(50)]
    public required string PlateNumber { get; set; }

    [Required]
    [MaxLength(50)]
    public required string VehicleType { get; set; }

    [MaxLength(255)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
