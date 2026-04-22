using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class BundleItem : ITenantEntity
{
    [Key]
    public int BundleItemId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int ParentItemId { get; set; }

    [ForeignKey(nameof(ParentItemId))]
    public Item? ParentItem { get; set; }

    public int ChildItemId { get; set; }

    [ForeignKey(nameof(ChildItemId))]
    public Item? ChildItem { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
