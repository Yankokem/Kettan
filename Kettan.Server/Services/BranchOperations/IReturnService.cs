using Kettan.Server.DTOs.Returns;

namespace Kettan.Server.Services.BranchOperations;

public interface IReturnService
{
    Task<List<ReturnDto>> ListAsync(string? status = null, string? resolution = null);
    Task<ReturnDto?> GetByIdAsync(int returnId);
    Task<List<ReturnEligibleOrderDto>> GetEligibleOrdersAsync();
    Task<ReturnEligibleOrderDto?> GetEligibleOrderDetailAsync(int orderId);
    Task<ReturnDto> CreateDraftAsync(CreateReturnDraftDto dto);
    Task<ReturnDto?> UpdateDraftAsync(int returnId, UpdateReturnDraftDto dto);
    Task<ReturnDto?> SubmitAsync(int returnId, SubmitReturnDto dto);
    Task<ReturnDto?> AcknowledgeAsync(int returnId, AcknowledgeReturnDto dto);
    Task<ReturnDto?> RejectAsync(int returnId, RejectReturnDto dto);
    Task<ReturnDto?> ReschedulePickupAsync(int returnId, RescheduleReturnPickupDto dto);
    Task<ReturnDto?> ConfirmDispatchAsync(int returnId, ConfirmReturnDispatchDto dto);
    Task<ReturnDto?> ConfirmArrivalAsync(int returnId, ConfirmReturnArrivalDto dto);
    Task<ReturnDto?> StartInspectionAsync(int returnId, StartReturnInspectionDto dto);
    Task<ReturnDto?> SaveInspectionAsync(int returnId, SaveReturnInspectionDto dto);
    Task<ReturnDto?> CompleteAsync(int returnId, CompleteReturnDto dto);
    Task<List<ReturnMessageDto>> GetMessagesAsync(int returnId);
    Task<ReturnMessageDto?> SendMessageAsync(int returnId, SendReturnMessageDto dto);
}
