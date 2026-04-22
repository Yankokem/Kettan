using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Tenant
{
    [Key]
    public int TenantId { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [MaxLength(50)]
    public string SubscriptionTier { get; set; } = "Starter";

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public int? CurrentSubscriptionId { get; set; }

    [ForeignKey(nameof(CurrentSubscriptionId))]
    public TenantSubscription? CurrentSubscription { get; set; }

    [Required]
    [MaxLength(30)]
    public string SubscriptionStatus { get; set; } = "Active";

    public DateTime? SubscriptionPeriodStart { get; set; }
    public DateTime? SubscriptionPeriodEnd { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Branch> Branches { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
}