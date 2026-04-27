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

    public string? PhotoUrls { get; set; }

    [Required]
    public ReturnResolution Resolution { get; set; } = ReturnResolution.Pending;

    public int? ReviewedBy_UserId { get; set; }

    [ForeignKey(nameof(ReviewedBy_UserId))]
    public User? ReviewedBy_User { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CreditAmount { get; set; }

    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public ICollection<ReturnItem> Items { get; set; } = [];
}