using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class User
{
    [Key]
    public int UserId { get; set; }

    // Nullable for SuperAdmins (Platform level)
    public int? TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    // Nullable for HQ Roles
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
    [EmailAddress]
    [MaxLength(50)]
    public required string Email { get; set; }

    [Required]
    [MaxLength(60)]
    public required string PasswordHash { get; set; }

    [Required]
    public required UserRole Role { get; set; }

    public DateOnly? Birthday { get; set; }

    [MaxLength(50)]
    public string? ContactNo { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    [MaxLength(300)]
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}