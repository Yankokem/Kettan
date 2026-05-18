using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Auth;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(100)]
    public required string Email { get; set; }

    [Required]
    [StringLength(64, MinimumLength = 6)]
    public required string Password { get; set; }
}