using System.ComponentModel.DataAnnotations;
using Kettan.Server.Enums;

namespace Kettan.Server.DTOs.Users;

public class UserDto
{
    public int UserId { get; set; }
    public int? TenantId { get; set; }
    public int? BranchId { get; set; }
    public string? BranchName { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateOnly? Birthday { get; set; }
    public string? ContactNo { get; set; }
    public bool IsActive { get; set; }
    public EmployeeStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ImageUrl { get; set; }
}

public class CreateUserDto
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public required string Email { get; set; }

    [Required]
    public required string Password { get; set; }

    [Required]
    public required string Role { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public required string FirstName { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public required string LastName { get; set; }

    public DateOnly? Birthday { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid contact number format.")]
    public string? ContactNo { get; set; }

    public int? BranchId { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
    public string? ImageUrl { get; set; }
}

public class UpdateUserDto
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public required string FirstName { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public required string LastName { get; set; }

    [Required]
    public required string Role { get; set; }

    public DateOnly? Birthday { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid contact number format.")]
    public string? ContactNo { get; set; }

    public int? BranchId { get; set; }
    public bool IsActive { get; set; }
    public EmployeeStatus Status { get; set; }
    public string? ImageUrl { get; set; }
}