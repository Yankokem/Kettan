using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Return : ITenantEntity
{
    [Key]
    public int ReturnId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int OrderId { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order? Order { get; set; }

    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    [Required]
    public required string Reason { get; set; }

    [Required]
    [MaxLength(50)]
    public string Resolution { get; set; } = "Pending"; // Pending, Replaced, Credited

    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;
}