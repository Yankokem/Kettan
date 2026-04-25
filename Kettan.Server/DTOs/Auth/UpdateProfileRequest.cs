namespace Kettan.Server.DTOs.Auth;

public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
