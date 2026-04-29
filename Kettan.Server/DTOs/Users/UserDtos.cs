namespace Kettan.Server.DTOs.Users;

public class UserDto
{
    public int UserId { get; set; }
    public int? TenantId { get; set; }
    public int? BranchId { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateOnly? Birthday { get; set; }
    public string? ContactNo { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ImageUrl { get; set; }
}

public class CreateUserDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string Role { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateOnly? Birthday { get; set; }
    public string? ContactNo { get; set; }
    public int? BranchId { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateUserDto
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Role { get; set; }
    public DateOnly? Birthday { get; set; }
    public string? ContactNo { get; set; }
    public int? BranchId { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
}