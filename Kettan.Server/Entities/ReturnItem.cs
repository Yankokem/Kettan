using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class ReturnItem : ITenantEntity
{
    [Key]
    public int ReturnItemId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int ReturnId { get; set; }

    [ForeignKey(nameof(ReturnId))]
    public Return? Return { get; set; }

    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityReturned { get; set; }

    [Required]
    [MaxLength(120)]
    public required string Reason { get; set; }
}
