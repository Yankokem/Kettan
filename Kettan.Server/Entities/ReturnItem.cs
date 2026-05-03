using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

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
    public ReturnItemReason ReasonCode { get; set; } = ReturnItemReason.Damaged;

    [Required]
    public ReturnItemDisposition Disposition { get; set; } = ReturnItemDisposition.Pending;

    [Column(TypeName = "decimal(18,4)")]
    public decimal? QuantityInspected { get; set; }

    public int? RestockBatchId { get; set; }

    [ForeignKey(nameof(RestockBatchId))]
    public Batch? RestockBatch { get; set; }

    [MaxLength(500)]
    public string? InspectionRemarks { get; set; }
}
