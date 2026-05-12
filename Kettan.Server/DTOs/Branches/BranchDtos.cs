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
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? ContactNumber { get; set; }
    public string? OpenTime { get; set; }
    public string? CloseTime { get; set; }
    public int? OwnerUserId { get; set; }
    public int? ManagerUserId { get; set; }
    public string? CustomThresholds { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateBranchDto
{
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? ContactNumber { get; set; }
    public string? OpenTime { get; set; }
    public string? CloseTime { get; set; }
    public int? OwnerUserId { get; set; }
    public int? ManagerUserId { get; set; }
    public string? CustomThresholds { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
}