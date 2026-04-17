using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class ConsumptionLogItem : ITenantEntity
{
    [Key]
    public int ConsumptionLogItemId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int ConsumptionLogId { get; set; }

    [ForeignKey(nameof(ConsumptionLogId))]
    public ConsumptionLog? ConsumptionLog { get; set; }

    public int? MenuItemId { get; set; }

    [ForeignKey(nameof(MenuItemId))]
    public MenuItem? MenuItem { get; set; }

    public int? ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [MaxLength(120)]
    public string? Reason { get; set; }
}
