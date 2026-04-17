using Kettan.Server.DTOs.Consumption;

namespace Kettan.Server.Services.BranchOperations;

public interface IConsumptionService
{
    Task<ConsumptionLogDto> LogSalesAsync(LogSalesConsumptionDto dto);
    Task<ConsumptionLogDto> LogDirectAsync(LogDirectConsumptionDto dto);
    Task<List<ConsumptionLogDto>> ListAsync(DateTime? from = null, DateTime? to = null, string? method = null);
}
