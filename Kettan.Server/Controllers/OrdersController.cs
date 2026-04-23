using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Orders;
using Kettan.Server.Services.BranchOperations;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderWorkflowService _service;

    public OrdersController(IOrderWorkflowService service)
    {
        _service = service;
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<OrderDetailDto>> CreateOrder([FromBody] CreateOrderDto dto)
    {
        try
        {
            var created = await _service.CreateHqOrderAsync(dto);
            return CreatedAtAction(nameof(GetOrder), new { id = created.OrderId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<BranchOrderDto>>> GetOrders([FromQuery] string? status = null)
    {
        var rows = await _service.ListBranchOrdersAsync(status);
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDetailDto>> GetOrder(int id)
    {
        var row = await _service.GetOrderDetailAsync(id);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    [HttpGet("{id:int}/tracking")]
    public async Task<ActionResult<List<OrderStatusHistoryDto>>> GetOrderTracking(int id)
    {
        var rows = await _service.GetOrderHistoryAsync(id);
        return Ok(rows);
    }

    [HttpPut("{id:int}/pick")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> StartPicking(int id, [FromBody] UpdateOrderStatusDto? dto = null)
    {
        try
        {
            var updated = await _service.StartPickingAsync(id, dto ?? new UpdateOrderStatusDto());
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

    [HttpPut("{id:int}/pack")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> ConfirmPacked(int id, [FromBody] UpdateOrderStatusDto? dto = null)
    {
        try
        {
            var updated = await _service.ConfirmPackedAsync(id, dto ?? new UpdateOrderStatusDto());
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

    [HttpPut("{id:int}/dispatch")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> Dispatch(int id, [FromBody] DispatchOrderDto dto)
    {
        try
        {
            var updated = await _service.DispatchAsync(id, dto);
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

    [HttpPut("{id:int}/deliver")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<IActionResult> ConfirmDelivered(int id, [FromBody] ConfirmDeliveryDto dto)
    {
        try
        {
            var updated = await _service.ConfirmDeliveryAsync(id, dto);
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
