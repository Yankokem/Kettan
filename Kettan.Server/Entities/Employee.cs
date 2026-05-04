using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class Employee : ITenantEntity
{
    [Key]
    public int EmployeeId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int? BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    [Required]
    [MaxLength(50)]
    public required string FirstName { get; set; }

    [Required]
    [MaxLength(50)]
    public required string LastName { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Position { get; set; }

    [MaxLength(50)]
    public string? ContactNumber { get; set; }

    public DateTime? DateHired { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    [MaxLength(50)]
    public string? Email { get; set; }

    [MaxLength(300)]
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
