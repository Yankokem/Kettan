using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class SubscriptionInvoice
{
    [Key]
    public int InvoiceId { get; set; }

    public int TenantSubscriptionId { get; set; }

    [ForeignKey(nameof(TenantSubscriptionId))]
    public TenantSubscription? TenantSubscription { get; set; }

    [Required]
    [MaxLength(50)]
    public required string InvoiceNumber { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountDue { get; set; }

    [Required]
    [MaxLength(10)]
    public string Currency { get; set; } = "PHP";

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Open";

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueAt { get; set; }
    public DateTime? PaidAt { get; set; }

    [MaxLength(120)]
    public string? ProviderReference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
