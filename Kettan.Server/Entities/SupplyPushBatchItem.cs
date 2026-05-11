using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class SupplyPushBatchItem : ITenantEntity
{
    [Key]
    public int SupplyPushBatchItemId { get; set; }

    public int TenantId { get; set; }

    public int SupplyPushBatchId { get; set; }

    [ForeignKey(nameof(SupplyPushBatchId))]
    public SupplyPushBatch? SupplyPushBatch { get; set; }

    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityRequested { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitCostSnapshot { get; set; }
}
