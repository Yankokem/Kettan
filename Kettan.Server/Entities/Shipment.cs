using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class Shipment : ITenantEntity
{
    [Key]
    public int ShipmentId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int OrderId { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order? Order { get; set; }

    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    [MaxLength(100)]
    public string? CourierAssignment { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? DistanceMap { get; set; }

    public DateTime? DispatchDate { get; set; }

    public DateTime? EstimatedArrival { get; set; }
}