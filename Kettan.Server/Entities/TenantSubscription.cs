using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class TenantSubscription
{
    [Key]
    public int TenantSubscriptionId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int PlanId { get; set; }

    [ForeignKey(nameof(PlanId))]
    public SubscriptionPlan? Plan { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active";

    [Required]
    [MaxLength(20)]
    public string BillingCycle { get; set; } = "Monthly";

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    public bool AutoRenew { get; set; } = true;
    public DateTime? CanceledAt { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
