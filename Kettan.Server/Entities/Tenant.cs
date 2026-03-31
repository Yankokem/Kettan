using System.ComponentModel.DataAnnotations;

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

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Branch> Branches { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
}