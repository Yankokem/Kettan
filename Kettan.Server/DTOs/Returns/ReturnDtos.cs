namespace Kettan.Server.DTOs.Returns;

public class ReturnEligibleOrderItemDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityDelivered { get; set; }
    public decimal BranchStock { get; set; }
}

public class ReturnEligibleOrderDto
{
    public int OrderId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public DateTime DeliveredAt { get; set; }
    public List<ReturnEligibleOrderItemDto> Items { get; set; } = [];
}

public class ReturnItemDto
{
    public int ReturnItemId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityReturned { get; set; }
    public decimal UnitCostSnapshot { get; set; }
    public decimal? QuantityInspected { get; set; }
    public string ReasonCode { get; set; } = string.Empty;
    public string Disposition { get; set; } = string.Empty;
    public int? RestockBatchId { get; set; }
    public string? InspectionRemarks { get; set; }
    public string? Notes { get; set; }
    public string? PhotoUrls { get; set; }
}

public class ReturnScheduleConflictDto
{
    public int ReturnId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PickupScheduledAt { get; set; }
}

public class ReturnMessageDto
{
    public int MessageId { get; set; }
    public int ReturnId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}

public class ReturnDto
{
    public int ReturnId { get; set; }
    public int OrderId { get; set; }
    public string? Subject { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Resolution { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? RejectionReason { get; set; }
    public string? PhotoUrls { get; set; }
    public decimal? CreditAmount { get; set; }
    public decimal TotalReturnedValue { get; set; }
    public decimal TotalLossValue { get; set; }
    public string PickupScheduleStatus { get; set; } = "NoSchedule";
    public DateTime LoggedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? DispatchedAt { get; set; }
    public DateTime? ArrivedAt { get; set; }
    public DateTime? InspectingAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? PickupVehicleId { get; set; }
    public string? PickupVehiclePlateNumber { get; set; }
    public DateTime? PickupScheduledAt { get; set; }
    public DateTime? PickupLastUpdatedAt { get; set; }
    public bool HasVehicleScheduleConflict { get; set; }
    public string? SubmittedByName { get; set; }
    public List<ReturnScheduleConflictDto> VehicleScheduleConflicts { get; set; } = [];
    public List<ReturnItemDto> Items { get; set; } = [];
}

public class CreateReturnDraftItemDto
{
    public int ItemId { get; set; }
    public decimal QuantityReturned { get; set; }
    public string ReasonCode { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? PhotoUrls { get; set; }
}

public class CreateReturnDraftDto
{
    public int OrderId { get; set; }
    public string? Subject { get; set; }
    public string Resolution { get; set; } = "Pending";
    public string? Reason { get; set; }
    public string? PhotoUrls { get; set; }
    public List<CreateReturnDraftItemDto> Items { get; set; } = [];
}

public class UpdateReturnDraftDto
{
    public string? Subject { get; set; }
    public string Resolution { get; set; } = "Pending";
    public string? Reason { get; set; }
    public string? PhotoUrls { get; set; }
    public List<CreateReturnDraftItemDto> Items { get; set; } = [];
}

public class SubmitReturnDto
{
    public string? Note { get; set; }
}

public class AcknowledgeReturnDto
{
    public string? Resolution { get; set; }
    public int VehicleId { get; set; }
    public DateTime PickupScheduledAt { get; set; }
    public bool AllowConflicts { get; set; } = true;
    public string? Note { get; set; }
}

public class RejectReturnDto
{
    public string Reason { get; set; } = string.Empty;
}

public class RescheduleReturnPickupDto
{
    public int VehicleId { get; set; }
    public DateTime PickupScheduledAt { get; set; }
    public string Note { get; set; } = string.Empty;
    public bool AllowConflicts { get; set; } = true;
}

public class ConfirmReturnDispatchDto
{
    public string? Remarks { get; set; }
}

public class ConfirmReturnArrivalDto
{
    public string? Remarks { get; set; }
}

public class StartReturnInspectionDto
{
    public string? Remarks { get; set; }
}

public class InspectReturnItemDto
{
    public int ReturnItemId { get; set; }
    public string Disposition { get; set; } = string.Empty;
    public decimal? QuantityInspected { get; set; }
    public int? RestockBatchId { get; set; }
    public string? InspectionRemarks { get; set; }
}

public class SaveReturnInspectionDto
{
    public List<InspectReturnItemDto> Items { get; set; } = [];
}

public class CompleteReturnDto
{
    public string? Remarks { get; set; }
}

public class SendReturnMessageDto
{
    public string Content { get; set; } = string.Empty;
}
