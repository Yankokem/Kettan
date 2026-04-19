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

    public int UnitId { get; set; }

    [ForeignKey(nameof(UnitId))]
    public Unit? Unit { get; set; }

    public int? InventoryCategoryId { get; set; }

    [ForeignKey(nameof(InventoryCategoryId))]
    public InventoryCategory? InventoryCategory { get; set; }

    public int? ItemCategoryId { get; set; }

    [ForeignKey(nameof(ItemCategoryId))]
    public ItemCategory? ItemCategory { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal DefaultThreshold { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitCost { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PreviousUnitCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? SellingPrice { get; set; }

    public bool IsBundle { get; set; } = false;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}