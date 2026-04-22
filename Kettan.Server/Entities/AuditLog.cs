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
    public required string Action { get; set; }

    [Required]
    [MaxLength(120)]
    public required string EntityName { get; set; }

    [MaxLength(120)]
    public string? EntityId { get; set; }

    [Required]
    [MaxLength(60)]
    public string EventCategory { get; set; } = "Application";

    public string? OldValues { get; set; } // JSON

    public string? NewValues { get; set; } // JSON

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    [MaxLength(512)]
    public string? UserAgent { get; set; }

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
