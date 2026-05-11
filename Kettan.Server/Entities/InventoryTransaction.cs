using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class InventoryTransaction : ITenantEntity
{
    [Key]
    public int TransactionId { get; set; }

    public int TenantId { get; set; }

    [MaxLength(20)]
    public string TransactionCode { get; set; } = string.Empty;

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int BatchId { get; set; }

    [ForeignKey(nameof(BatchId))]
    public Batch? Batch { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityChange { get; set; }

    [Required]
    public required TransactionType TransactionType { get; set; }

    public ReferenceType? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    public string? Remarks { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}