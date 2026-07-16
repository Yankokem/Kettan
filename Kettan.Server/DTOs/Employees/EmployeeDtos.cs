using System.ComponentModel.DataAnnotations;
using Kettan.Server.Enums;

namespace Kettan.Server.DTOs.Employees;

public class EmployeeDto
{
    public int EmployeeId { get; set; }
    public int TenantId { get; set; }
    public int? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public DateTime? DateHired { get; set; }
    public bool IsActive { get; set; }
    public EmployeeStatus Status { get; set; }
    public string? Email { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEmployeeDto
{
    public int? BranchId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Position { get; set; } = string.Empty;

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid phone number format.")]
    [StringLength(50)]
    public string? ContactNumber { get; set; }

    public DateTime? DateHired { get; set; }
    public bool IsActive { get; set; } = true;
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    [EmailAddress]
    [StringLength(50)]
    public string? Email { get; set; }

    [StringLength(300)]
    public string? ImageUrl { get; set; }
}

public class UpdateEmployeeDto
{
    public int? BranchId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Position { get; set; } = string.Empty;

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid phone number format.")]
    [StringLength(50)]
    public string? ContactNumber { get; set; }

    public DateTime? DateHired { get; set; }
    public bool IsActive { get; set; }
    public EmployeeStatus Status { get; set; }

    [EmailAddress]
    [StringLength(50)]
    public string? Email { get; set; }

    [StringLength(300)]
    public string? ImageUrl { get; set; }
}
