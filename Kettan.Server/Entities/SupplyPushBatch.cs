using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Kettan.Server.Enums;

namespace Kettan.Server.Entities;

public class SupplyPushBatch : ITenantEntity
{
    [Key]
    public int SupplyPushBatchId { get; set; }

    public int TenantId { get; set; }

    [MaxLength(20)]
    public string TransactionCode { get; set; } = string.Empty;

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int CreatedByUserId { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public User? CreatedByUser { get; set; }

    [MaxLength(80)]
    public string? Subject { get; set; }

    [Required]
    public RequestType RequestType { get; set; } = RequestType.HqInitiated;

    [Required]
    public Priority Priority { get; set; } = Priority.Normal;

    [Required]
    public DispatchWindow DispatchWindow { get; set; } = DispatchWindow.Anytime;

    public DateTime? DispatchDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SupplyPushBatchItem> Items { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}
