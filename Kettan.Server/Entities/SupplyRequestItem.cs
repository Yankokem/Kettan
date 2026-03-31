using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class SupplyRequestItem
{
    [Key]
    public int RequestItemId { get; set; }

    public int RequestId { get; set; }

    [ForeignKey(nameof(RequestId))]
    public SupplyRequest? SupplyRequest { get; set; }

    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityRequested { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? QuantityApproved { get; set; }
}