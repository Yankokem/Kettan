namespace Kettan.Server.DTOs.Branches;

public class BranchDto
{
    public int BranchId { get; set; }
    public int TenantId { get; set; }
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? CustomThresholds { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBranchDto
{
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? CustomThresholds { get; set; }
}

public class UpdateBranchDto
{
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? CustomThresholds { get; set; }
    public bool IsActive { get; set; }
}