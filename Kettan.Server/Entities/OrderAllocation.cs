using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class OrderAllocation
{
    [Key]
    public int AllocationId { get; set; }

    public int OrderId { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order? Order { get; set; }

    public int BatchId { get; set; }

    [ForeignKey(nameof(BatchId))]
    public Batch? Batch { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityPicked { get; set; }
}