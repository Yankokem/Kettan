using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

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
    [MaxLength(5)]
    public string Currency { get; set; } = "PHP";

    [Required]
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueAt { get; set; }
    public DateTime? PaidAt { get; set; }

    [MaxLength(50)]
    public string? ProviderReference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
