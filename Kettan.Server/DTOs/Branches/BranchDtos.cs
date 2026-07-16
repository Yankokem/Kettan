using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Branches;

public class BranchDto
{
    public int BranchId { get; set; }
    public int TenantId { get; set; }
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? CustomThresholds { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? ContactNumber { get; set; }
    public string? OpenTime { get; set; }
    public string? CloseTime { get; set; }
    public int? OwnerUserId { get; set; }

    // Aggregates
    public string? ManagerName { get; set; }
    public int StaffCount { get; set; }
    public int TotalItems { get; set; }
    public int LowStockItems { get; set; }
}

public class CreateBranchDto
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public required string Name { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    [StringLength(200)]
    public string? Address { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid contact number format.")]
    public string? ContactNumber { get; set; }

    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Time must be in HH:mm format.")]
    public string? OpenTime { get; set; }

    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Time must be in HH:mm format.")]
    public string? CloseTime { get; set; }

    public int? OwnerUserId { get; set; }
    public int? ManagerUserId { get; set; }
    public string? CustomThresholds { get; set; }

    [StringLength(300)]
    public string? ImageUrl { get; set; }
}

public class UpdateBranchDto
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public required string Name { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    [StringLength(200)]
    public string? Address { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid contact number format.")]
    public string? ContactNumber { get; set; }

    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Time must be in HH:mm format.")]
    public string? OpenTime { get; set; }

    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Time must be in HH:mm format.")]
    public string? CloseTime { get; set; }

    public int? OwnerUserId { get; set; }
    public int? ManagerUserId { get; set; }
    public string? CustomThresholds { get; set; }

    [StringLength(300)]
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
}