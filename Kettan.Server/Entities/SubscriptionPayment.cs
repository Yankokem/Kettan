using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
    [MaxLength(10)]
    public string Currency { get; set; } = "PHP";

    [MaxLength(40)]
    public string? PaymentMethod { get; set; }

    [MaxLength(40)]
    public string? Provider { get; set; }

    [MaxLength(120)]
    public string? ProviderPaymentId { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Pending";

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
