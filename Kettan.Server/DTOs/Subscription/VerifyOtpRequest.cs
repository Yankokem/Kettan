using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class VerifyOtpRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public required string Email { get; set; }

    [Required]
    [RegularExpression("^\\d{6}$")]
    [MaxLength(6)]
    [MinLength(6)]
    public required string OtpCode { get; set; }
}
