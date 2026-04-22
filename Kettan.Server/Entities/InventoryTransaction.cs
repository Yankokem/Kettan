using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class InventoryTransaction : ITenantEntity
{
    [Key]
    public int TransactionId { get; set; }

    public int TenantId { get; set; }

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
    [MaxLength(50)]
    // Consumption, Sales_Auto, Physical_Count, Transfer, Restock
    public required string TransactionType { get; set; } 

    [MaxLength(50)]
    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    public string? Remarks { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}