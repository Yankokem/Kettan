using Kettan.Server.DTOs.Returns;

namespace Kettan.Server.Services.BranchOperations;

public interface IReturnService
{
    Task<List<ReturnDto>> ListAsync(string? resolution = null);
    Task<ReturnDto?> GetByIdAsync(int returnId);
    Task<ReturnDto> CreateAsync(CreateReturnDto dto);
    Task<bool> ResolveAsync(int returnId, ResolveReturnDto dto);
}
