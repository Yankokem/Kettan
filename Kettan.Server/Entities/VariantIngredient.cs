using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class VariantIngredient
{
    [Key]
    public int VariantIngredientId { get; set; }

    public int VariantId { get; set; }

    [ForeignKey(nameof(VariantId))]
    public MenuVariant? Variant { get; set; }

    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }
}
