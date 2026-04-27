namespace Kettan.Server.DTOs.Auth;

public class LoginResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public int? BranchId { get; set; }
    public string? ImageUrl { get; set; }
}
