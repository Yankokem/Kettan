using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class SubscriptionPayment
{
    [Key]
    public int PaymentId { get; set; }

    public int InvoiceId { get; set; }

    [ForeignKey(nameof(InvoiceId))]
    public SubscriptionInvoice? Invoice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(5)]
    public string Currency { get; set; } = "PHP";

    public PaymentMethod? PaymentMethod { get; set; }

    public PaymentProvider? Provider { get; set; }

    [MaxLength(30)]
    public string? ProviderPaymentId { get; set; }

    [Required]
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
