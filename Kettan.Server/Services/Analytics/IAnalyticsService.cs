using Kettan.Server.DTOs.Analytics;

namespace Kettan.Server.Services.Analytics;

public interface IAnalyticsService
{
    Task<EoqResultDto> CalculateEOQAsync(int itemId);
    Task<List<BranchScorecardDto>> CalculateBranchScoresAsync(DateTime startDate, DateTime endDate);
    Task<InventorySummaryDto> GetInventorySummaryAsync(int? branchId = null);
    Task<OrderFulfillmentMetricsDto> GetFulfillmentMetricsAsync(DateTime startDate, DateTime endDate);
    Task<List<ConsumptionTrendDto>> GetConsumptionTrendsAsync(DateTime startDate, DateTime endDate);
}
