using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class MenuItem : ITenantEntity
{
    [Key]
    public int MenuItemId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SellingPrice { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MenuItemIngredient> Ingredients { get; set; } = [];
}
