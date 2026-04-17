using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Orders;
using Kettan.Server.Services.BranchOperations;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BranchOrdersController : ControllerBase
{
    private readonly IOrderWorkflowService _service;

    public BranchOrdersController(IOrderWorkflowService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<BranchOrderDto>>> GetBranchOrders([FromQuery] string? status = null)
    {
        var rows = await _service.ListBranchOrdersAsync(status);
        return Ok(rows);
    }

    [HttpGet("{orderId:int}/history")]
    public async Task<ActionResult<List<OrderStatusHistoryDto>>> GetOrderHistory(int orderId)
    {
        var rows = await _service.GetOrderHistoryAsync(orderId);
        return Ok(rows);
    }

    [HttpPost("{orderId:int}/confirm-delivery")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<IActionResult> ConfirmDelivery(int orderId, [FromBody] ConfirmDeliveryDto dto)
    {
        try
        {
            var updated = await _service.ConfirmDeliveryAsync(orderId, dto);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
