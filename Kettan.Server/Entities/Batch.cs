using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Batch : ITenantEntity
{
    [Key]
    public int BatchId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    // Null = Sitting in HQ Inventory, Not Null = Sitting in Branch Inventory
    public int? BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    [Required]
    [MaxLength(100)]
    public required string BatchNumber { get; set; }

    public DateTime ExpiryDate { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal CurrentQuantity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}