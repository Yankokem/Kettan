using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class ConsumptionLog : ITenantEntity
{
    [Key]
    public int ConsumptionLogId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    public int LoggedBy_UserId { get; set; }

    [ForeignKey(nameof(LoggedBy_UserId))]
    public User? LoggedBy_User { get; set; }

    [Required]
    [MaxLength(30)]
    public required string Method { get; set; } // Sales, Direct, PhysicalCount

    [MaxLength(30)]
    public string? Shift { get; set; }

    public DateTime LogDate { get; set; } = DateTime.UtcNow;

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ConsumptionLogItem> Items { get; set; } = [];
}
