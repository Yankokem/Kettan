using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class Tenant
{
    [Key]
    public int TenantId { get; set; }

    [Required]
    [MaxLength(120)]
    public required string Name { get; set; }

    public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Starter;

    [MaxLength(254)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(180)]
    public string? LegalName { get; set; }

    [MaxLength(32)]
    public string? TaxId { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [MaxLength(254)]
    public string? SupportEmail { get; set; }

    [MaxLength(300)]
    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public int? CurrentSubscriptionId { get; set; }

    [ForeignKey(nameof(CurrentSubscriptionId))]
    public TenantSubscription? CurrentSubscription { get; set; }

    [Required]
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.Active;

    public DateTime? SubscriptionPeriodStart { get; set; }
    public DateTime? SubscriptionPeriodEnd { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Branch> Branches { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
}
