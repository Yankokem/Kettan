using Kettan.Server.DTOs.SupplyRequests;

namespace Kettan.Server.Services.BranchOperations;

public interface ISupplyRequestService
{
    Task<List<SupplyRequestDto>> ListAsync(string? status = null);
    Task<SupplyRequestDto?> GetByIdAsync(int requestId);
    Task<SupplyRequestDto> CreateDraftAsync(CreateSupplyRequestDto dto);
    Task<bool> SubmitAsync(int requestId, string? notes = null);
}
