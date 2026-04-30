using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class SupplyRequestItem : ITenantEntity
{
    [Key]
    public int RequestItemId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

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

    // ── Picking workflow ──
    public bool IsPicked { get; set; } = false;

    [Column(TypeName = "decimal(18,4)")]
    public decimal? SendQuantity { get; set; }

    public bool IsRejectedDuringPicking { get; set; } = false;

    [MaxLength(500)]
    public string? PickingRejectionReason { get; set; }

    // ── Packing workflow ──
    public bool IsPacked { get; set; } = false;

    // ── Branch final check ──
    public bool IsBranchChecked { get; set; } = false;
}