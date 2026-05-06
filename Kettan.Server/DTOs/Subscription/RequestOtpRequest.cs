using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class RequestOtpRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public required string Email { get; set; }
}
