using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class SupplyRequest : ITenantEntity
{
    [Key]
    public int RequestId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    public int RequestedBy_UserId { get; set; }

    [ForeignKey(nameof(RequestedBy_UserId))]
    public User? RequestedBy_User { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Auto_Drafted, PendingApproval, Approved, Rejected

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SupplyRequestItem> Items { get; set; } = [];
}