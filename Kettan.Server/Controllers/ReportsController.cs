using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Analytics;
using Kettan.Server.Services.Analytics;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
public class ReportsController : ControllerBase
{
    private readonly IAnalyticsService _service;

    public ReportsController(IAnalyticsService service)
    {
        _service = service;
    }

    [HttpGet("inventory-summary")]
    public async Task<ActionResult<InventorySummaryDto>> GetInventorySummary([FromQuery] int? branchId = null)
    {
        try
        {
            var result = await _service.GetInventorySummaryAsync(branchId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("order-fulfillment")]
    public async Task<ActionResult<OrderFulfillmentMetricsDto>> GetFulfillmentMetrics(
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        try
        {
            var result = await _service.GetFulfillmentMetricsAsync(startDate, endDate);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("consumption-trends")]
    public async Task<ActionResult<List<ConsumptionTrendDto>>> GetConsumptionTrends(
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        var result = await _service.GetConsumptionTrendsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch-scorecard")]
    public async Task<ActionResult<List<BranchScorecardDto>>> GetBranchScorecard(
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        var result = await _service.CalculateBranchScoresAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("eoq/{itemId}")]
    public async Task<ActionResult<EoqResultDto>> GetEoq(int itemId)
    {
        try
        {
            var result = await _service.CalculateEOQAsync(itemId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
