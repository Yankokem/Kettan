using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class CreateCheckoutSessionRequest
{
    [Required]
    public int PlanId { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}
