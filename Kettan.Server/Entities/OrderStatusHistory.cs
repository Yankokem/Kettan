using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class OrderStatusHistory : ITenantEntity
{
    [Key]
    public int HistoryId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int OrderId { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order? Order { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Status { get; set; }

    public int? ChangedBy_UserId { get; set; }

    [ForeignKey(nameof(ChangedBy_UserId))]
    public User? ChangedBy_User { get; set; }

    public string? Remarks { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
