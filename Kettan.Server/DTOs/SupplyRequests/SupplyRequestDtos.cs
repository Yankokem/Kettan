using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.SupplyRequests;

public class SupplyRequestItemDto
{
    public int RequestItemId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityRequested { get; set; }
    public decimal? QuantityApproved { get; set; }
    public decimal UnitCostSnapshot { get; set; }

    // Workflow fields
    public bool IsPicked { get; set; }
    public decimal? SendQuantity { get; set; }
    public bool IsRejectedDuringPicking { get; set; }
    public string? PickingRejectionReason { get; set; }
    public bool IsPacked { get; set; }
    public bool IsBranchChecked { get; set; }
    public decimal? HqStock { get; set; }
}

public class SupplyRequestDto
{
    public string TransactionCode { get; set; } = string.Empty;
    public int RequestId { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Subject { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RequestType { get; set; } = "manual";
    public string Priority { get; set; } = "normal";
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }
    public string DispatchScheduleStatus { get; set; } = "NoSchedule";
    public string? Notes { get; set; }
    public decimal TotalRequestedValue { get; set; }
    public decimal TotalApprovedValue { get; set; }
    public decimal TotalFulfilledValue { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public int? OrderId { get; set; }
    public string? OrderStatus { get; set; }
    public DateTime? ArrivedAt { get; set; }
    public string? ArrivedConfirmedByName { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedByName { get; set; }

    public List<SupplyRequestItemDto> Items { get; set; } = [];
}

public class CreateSupplyRequestItemDto
{
    public int ItemId { get; set; }

    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity requested must be greater than zero.")]
    public decimal QuantityRequested { get; set; }
}

public class CreateSupplyRequestDto
{
    public int? BranchId { get; set; }

    [StringLength(100)]
    public string? ReferenceNumber { get; set; }

    [StringLength(80)]
    public string? Subject { get; set; }

    [Required]
    [StringLength(20)]
    public string RequestType { get; set; } = "manual";

    [Required]
    [StringLength(20)]
    public string Priority { get; set; } = "normal";

    [Required]
    [StringLength(20)]
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
    public List<CreateSupplyRequestItemDto> Items { get; set; } = [];
}

public class UpdateSupplyRequestDto
{
    [StringLength(100)]
    public string? ReferenceNumber { get; set; }

    [StringLength(80)]
    public string? Subject { get; set; }

    [Required]
    [StringLength(20)]
    public string RequestType { get; set; } = "manual";

    [Required]
    [StringLength(20)]
    public string Priority { get; set; } = "normal";

    [Required]
    [StringLength(20)]
    public string DispatchWindow { get; set; } = "today";
    public DateTime? DispatchDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
    public List<CreateSupplyRequestItemDto> Items { get; set; } = [];
}

public class ApproveSupplyRequestItemDto
{
    public int RequestItemId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Quantity approved cannot be negative.")]
    public decimal QuantityApproved { get; set; }
}

public class ApproveSupplyRequestDto
{
    [StringLength(1000)]
    public string? Notes { get; set; }
    public List<ApproveSupplyRequestItemDto> Items { get; set; } = [];
}

public class RejectSupplyRequestDto
{
    [StringLength(200)]
    public string? Reason { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class CancelSupplyRequestDto
{
    [StringLength(200)]
    public string? Reason { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class SubmitSupplyRequestDto
{
    [StringLength(1000)]
    public string? Notes { get; set; }
}
