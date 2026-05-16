using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public required string Email { get; set; }

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public required string OtpCode { get; set; }

    [Required]
    [StringLength(64, MinimumLength = 8)]
    public required string NewPassword { get; set; }
}
