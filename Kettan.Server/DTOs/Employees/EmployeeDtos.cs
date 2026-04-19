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
    public DateTime CreatedAt { get; set; }
}

public class CreateEmployeeDto
{
    public int? BranchId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public DateTime? DateHired { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateEmployeeDto
{
    public int? BranchId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public DateTime? DateHired { get; set; }
    public bool IsActive { get; set; }
}
