using Kettan.Server.DTOs.SupplyRequests;

namespace Kettan.Server.Services.BranchOperations;

public interface ISupplyRequestService
{
    Task<List<SupplyRequestDto>> ListAsync(string? status = null);
    Task<SupplyRequestDto?> GetByIdAsync(int requestId);
    Task<SupplyRequestDto> CreateDraftAsync(CreateSupplyRequestDto dto);
    Task<SupplyRequestDto?> UpdateDraftAsync(int requestId, UpdateSupplyRequestDto dto);
    Task<bool> SubmitAsync(int requestId, string? notes = null);
    Task<SupplyRequestDto?> ApproveAsync(int requestId, ApproveSupplyRequestDto dto);
    Task<SupplyRequestDto?> RejectAsync(int requestId, RejectSupplyRequestDto dto);
    Task<SupplyRequestDto?> CancelAsync(int requestId, CancelSupplyRequestDto dto);
    Task<SupplyRequestDto?> AutoDraftOnLowStockAsync(int branchId);
}
