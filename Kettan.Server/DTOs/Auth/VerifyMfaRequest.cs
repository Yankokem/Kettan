using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Auth;

public class VerifyMfaRequest
{
    [Required]
    public required string MfaToken { get; set; }

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public required string OtpCode { get; set; }
}
