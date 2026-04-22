using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class PayMongoWebhookPayload
{
    [Required]
    [MaxLength(80)]
    public required string EventType { get; set; }

    [Required]
    [MaxLength(120)]
    public required string ProviderReference { get; set; }

    [MaxLength(120)]
    public string? ProviderPaymentId { get; set; }

    [Required]
    [MaxLength(30)]
    public required string Status { get; set; }

    public DateTime? PaidAtUtc { get; set; }
}
