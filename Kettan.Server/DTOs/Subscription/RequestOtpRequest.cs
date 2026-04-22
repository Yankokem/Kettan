using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class RequestOtpRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public required string Email { get; set; }
}
