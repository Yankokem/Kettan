using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Branch : ITenantEntity
{
    [Key]
    public int BranchId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? City { get; set; }

    [MaxLength(50)]
    public string? ContactNumber { get; set; }

    public TimeOnly? OpenTime { get; set; }
    public TimeOnly? CloseTime { get; set; }

    public int? OwnerUserId { get; set; }

    [ForeignKey(nameof(OwnerUserId))]
    public User? OwnerUser { get; set; }

    public int? ManagerUserId { get; set; }

    [ForeignKey(nameof(ManagerUserId))]
    public User? ManagerUser { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    public string? CustomThresholds { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}