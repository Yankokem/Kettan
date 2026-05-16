using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Auth;

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public required string Email { get; set; }
}
