using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Analytics;
using Kettan.Server.Services.Analytics;
using Kettan.Server.Services.Export;
using Kettan.Server.Data;
using Microsoft.EntityFrameworkCore;
using Unit = Kettan.Server.Entities.Unit;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
public class ReportsController : ControllerBase
{
    private readonly IAnalyticsService _service;
    private readonly ApplicationDbContext _context;
    private readonly ICsvExportService _csvExportService;
    private readonly IPdfExportService _pdfExportService;

    public ReportsController(
        IAnalyticsService service,
        ApplicationDbContext context,
        ICsvExportService csvExportService,
        IPdfExportService pdfExportService)
    {
        _service = service;
        _context = context;
        _csvExportService = csvExportService;
        _pdfExportService = pdfExportService;
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

    [HttpGet("inventory/export")]
    public async Task<IActionResult> ExportInventory([FromQuery] string format = "csv")
    {
        var items = await _context.Items
            .Include(i => i.Unit)
            .Include(i => i.InventoryCategory)
            .Include(i => i.ItemCategory)
            .Select(i => new
            {
                i.ItemId,
                i.SKU,
                i.Name,
                Unit = i.Unit != null ? i.Unit.Name : "",
                InventoryCategory = i.InventoryCategory != null ? i.InventoryCategory.Name : "",
                ItemCategory = i.ItemCategory != null ? i.ItemCategory.Name : "",
                i.DefaultThreshold,
                i.UnitCost,
                i.SellingPrice
            })
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Inventory Report", items);
            return File(pdfBytes, "application/pdf", "inventory_report.pdf");
        }
        else
        {
            var csvBytes = _csvExportService.ExportToCsv(items);
            return File(csvBytes, "text/csv", "inventory_report.csv");
        }
    }

    [HttpGet("orders/export")]
    public async Task<IActionResult> ExportOrders([FromQuery] string format = "csv")
    {
        var orders = await _context.Orders
            .Include(o => o.SupplyRequest)
            .ThenInclude(sr => sr != null ? sr.Branch : null)
            .Select(o => new
            {
                o.OrderId,
                RequestId = o.RequestId,
                BranchName = (o.SupplyRequest != null && o.SupplyRequest.Branch != null) ? o.SupplyRequest.Branch.Name : "",
                o.Status,
                o.PushedToFulfillmentAt
            })
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Orders Report", orders);
            return File(pdfBytes, "application/pdf", "orders_report.pdf");
        }
        else
        {
            var csvBytes = _csvExportService.ExportToCsv(orders);
            return File(csvBytes, "text/csv", "orders_report.csv");
        }
    }

    [HttpGet("returns/export")]
    public async Task<IActionResult> ExportReturns([FromQuery] string format = "csv")
    {
        var returns = await _context.Returns
            .Include(r => r.Branch)
            .Select(r => new
            {
                r.ReturnId,
                r.OrderId,
                BranchName = r.Branch != null ? r.Branch.Name : "",
                r.Resolution,
                r.Reason,
                r.CreditAmount,
                r.LoggedAt
            })
            .OrderByDescending(r => r.LoggedAt)
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Returns Report", returns);
            return File(pdfBytes, "application/pdf", "returns_report.pdf");
        }
        else
        {
            var csvBytes = _csvExportService.ExportToCsv(returns);
            return File(csvBytes, "text/csv", "returns_report.csv");
        }
    }
}
