using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Item : ITenantEntity
{
    [Key]
    public int ItemId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(100)]
    public required string SKU { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(50)]
    public required string UnitOfMeasure { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal DefaultThreshold { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitCost { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}