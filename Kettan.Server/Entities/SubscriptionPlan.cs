using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class SubscriptionPlan
{
    [Key]
    public int PlanId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string PlanCode { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceMonthly { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PriceYearly { get; set; }

    public int? BranchLimit { get; set; }
    public int? UserLimit { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
