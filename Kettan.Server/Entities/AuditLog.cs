using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class AuditLog
{
    [Key]
    public long AuditLogId { get; set; }

    public int? TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    [MaxLength(80)]
    public required string Action { get; set; } // Created, Updated, Deleted

    [Required]
    [MaxLength(120)]
    public required string EntityName { get; set; }

    [MaxLength(120)]
    public string? EntityId { get; set; }

    public int? BranchId { get; set; }

    public string? OldValues { get; set; } // JSON

    public string? NewValues { get; set; } // JSON

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

}
