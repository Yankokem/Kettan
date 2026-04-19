using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Order : ITenantEntity
{
    [Key]
    public int OrderId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int RequestId { get; set; }

    [ForeignKey(nameof(RequestId))]
    public SupplyRequest? SupplyRequest { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Processing"; // Processing, Picking, Packed, Dispatched, Delivered, Returned

    public DateTime PushedToFulfillmentAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public ICollection<OrderAllocation> Allocations { get; set; } = [];
}