using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

/// <summary>
/// Join table that records every supplier that has ever supplied a given item.
/// Rows are append-only; the most-recently created row is the preferred/active supplier.
/// </summary>
public class ItemSupplier
{
    [Key]
    public int ItemSupplierId { get; set; }

    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    public int SupplierId { get; set; }

    [ForeignKey(nameof(SupplierId))]
    public Supplier? Supplier { get; set; }

    /// <summary>When this supplier was first linked to the item (via a Stock-In).</summary>
    public DateTime LinkedAt { get; set; } = DateTime.UtcNow;
}