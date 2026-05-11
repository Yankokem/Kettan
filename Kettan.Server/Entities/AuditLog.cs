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

    [MaxLength(80)]
    public string? ActionCode { get; set; }

    [MaxLength(40)]
    public string? Outcome { get; set; }

    [MaxLength(20)]
    public string? Severity { get; set; }

    [MaxLength(40)]
    public string? Source { get; set; }

    [MaxLength(10)]
    public string? HttpMethod { get; set; }

    [MaxLength(255)]
    public string? Route { get; set; }

    public int? StatusCode { get; set; }

    [MaxLength(64)]
    public string? CorrelationId { get; set; }

    public int? BranchId { get; set; }

    [MaxLength(80)]
    public string? Module { get; set; }

    [MaxLength(80)]
    public string? ReferenceType { get; set; }

    [MaxLength(120)]
    public string? ReferenceId { get; set; }

    [MaxLength(80)]
    public string? ErrorCode { get; set; }

    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    public string? MetadataJson { get; set; }

    public string? ChangedFieldsJson { get; set; }

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
