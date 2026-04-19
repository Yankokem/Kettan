using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class MenuVariant
{
    [Key]
    public int VariantId { get; set; }

    public int MenuItemId { get; set; }

    [ForeignKey(nameof(MenuItemId))]
    public MenuItem? MenuItem { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(10)]
    public string PricingMode { get; set; } = "absolute"; // absolute or relative

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
