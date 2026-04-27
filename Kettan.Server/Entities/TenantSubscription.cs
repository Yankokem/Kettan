using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

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
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    [Required]
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;

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
