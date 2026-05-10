using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class Order : ITenantEntity
{
    [Key]
    public int OrderId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int RequestId { get; set; }

    [ForeignKey(nameof(RequestId))]
    public SupplyRequest? SupplyRequest { get; set; }

    [Required]
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public DateTime PushedToFulfillmentAt { get; set; } = DateTime.UtcNow;

    // ── Arrival tracking (Branch confirms) ──
    public DateTime? ArrivedAt { get; set; }
    public int? ArrivedConfirmedByUserId { get; set; }

    [ForeignKey(nameof(ArrivedConfirmedByUserId))]
    public User? ArrivedConfirmedByUser { get; set; }

    // ── Completion tracking (Branch completes) ──
    public DateTime? CompletedAt { get; set; }
    public int? CompletedByUserId { get; set; }

    [ForeignKey(nameof(CompletedByUserId))]
    public User? CompletedByUser { get; set; }

    // ── HQ Supply Dispatch fields ──
    public bool IsHqInitiated { get; set; } = false;

    [MaxLength(200)]
    public string? DispatchReason { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public Shipment? Shipment { get; set; }
    
    [NotMapped]
    public DateTime? DeliveredAt => ArrivedAt;

    public ICollection<OrderAllocation> Allocations { get; set; } = [];
}