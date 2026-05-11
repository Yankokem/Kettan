using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class SupplyRequest : ITenantEntity
{
    [Key]
    public int RequestId { get; set; }

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    [MaxLength(80)]
    public string? Subject { get; set; }

    public int TenantId { get; set; }

    [MaxLength(20)]
    public string TransactionCode { get; set; } = string.Empty;

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    public int RequestedBy_UserId { get; set; }

    [ForeignKey(nameof(RequestedBy_UserId))]
    public User? RequestedBy_User { get; set; }

    [Required]
    public SupplyRequestStatus Status { get; set; } = SupplyRequestStatus.Pending;

    [Required]
    public RequestType RequestType { get; set; } = RequestType.Regular;

    [Required]
    public Priority Priority { get; set; } = Priority.Normal;

    [Required]
    public DispatchWindow DispatchWindow { get; set; } = DispatchWindow.Anytime;

    public DateTime? DispatchDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRequestedValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalApprovedValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalFulfilledValue { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public ICollection<SupplyRequestItem> Items { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}
