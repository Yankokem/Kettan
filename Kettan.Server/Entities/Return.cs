using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class Return : ITenantEntity
{
    [Key]
    public int ReturnId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int OrderId { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order? Order { get; set; }

    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    [MaxLength(100)]
    public string? Reason { get; set; }

    [MaxLength(80)]
    public string? Subject { get; set; }

    public string? PhotoUrls { get; set; }

    [Required]
    public ReturnStatus Status { get; set; } = ReturnStatus.Draft;

    [Required]
    public ReturnResolution Resolution { get; set; } = ReturnResolution.Pending;

    public int? PickupVehicleId { get; set; }

    [ForeignKey(nameof(PickupVehicleId))]
    public Vehicle? PickupVehicle { get; set; }

    public DateTime? PickupScheduledAt { get; set; }
    public DateTime? PickupLastUpdatedAt { get; set; }

    [MaxLength(500)]
    public string? RejectionReason { get; set; }

    public DateTime? SubmittedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? DispatchedAt { get; set; }
    public DateTime? ArrivedAt { get; set; }
    public DateTime? InspectingAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RejectedAt { get; set; }

    public int? ReviewedBy_UserId { get; set; }

    [ForeignKey(nameof(ReviewedBy_UserId))]
    public User? ReviewedBy_User { get; set; }

    public int? SubmittedBy_UserId { get; set; }

    [ForeignKey(nameof(SubmittedBy_UserId))]
    public User? SubmittedBy_User { get; set; }

    public int? AcknowledgedBy_UserId { get; set; }

    [ForeignKey(nameof(AcknowledgedBy_UserId))]
    public User? AcknowledgedBy_User { get; set; }

    public int? DispatchedBy_UserId { get; set; }

    [ForeignKey(nameof(DispatchedBy_UserId))]
    public User? DispatchedBy_User { get; set; }

    public int? ArrivedBy_UserId { get; set; }

    [ForeignKey(nameof(ArrivedBy_UserId))]
    public User? ArrivedBy_User { get; set; }

    public int? InspectedBy_UserId { get; set; }

    [ForeignKey(nameof(InspectedBy_UserId))]
    public User? InspectedBy_User { get; set; }

    public int? CompletedBy_UserId { get; set; }

    [ForeignKey(nameof(CompletedBy_UserId))]
    public User? CompletedBy_User { get; set; }

    public int? RejectedBy_UserId { get; set; }

    [ForeignKey(nameof(RejectedBy_UserId))]
    public User? RejectedBy_User { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CreditAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalReturnedValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalLossValue { get; set; }

    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public ICollection<ReturnItem> Items { get; set; } = [];
    public ICollection<ReturnMessage> Messages { get; set; } = [];
}
