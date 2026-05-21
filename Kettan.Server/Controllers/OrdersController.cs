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

    [HttpGet("hq-dispatches")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<BranchOrderDto>>> GetHqDispatches([FromQuery] string? status = null)
    {
        var rows = await _service.ListHqDispatchesAsync(status);
        return Ok(rows);
    }

    [HttpGet("incoming-shipments")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<List<BranchOrderDto>>> GetIncomingShipments([FromQuery] string? status = null)
    {
        var rows = await _service.ListIncomingShipmentsAsync(status);
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

    // ── SR WORKFLOW ENDPOINTS ──

    [HttpGet("{id:int}/picking-suggestions")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchManager,BranchOwner")]
    public async Task<ActionResult<List<PickingSuggestionDto>>> GetPickingSuggestions(int id)
    {
        var suggestions = await _service.GetPickingSuggestionsAsync(id);
        return Ok(suggestions);
    }

    [HttpPut("{id:int}/workflow/pick")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<OrderDetailDto>> SavePicking(int id, [FromBody] PickingSubmitDto dto)
    {
        var result = await _service.SavePickingAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:int}/workflow/pack")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<OrderDetailDto>> SavePacking(int id, [FromBody] PackingSubmitDto dto)
    {
        var result = await _service.SavePackingAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:int}/workflow/dispatch")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<OrderDetailDto>> SubmitDispatch(int id, [FromBody] DispatchOrderDto dto)
    {
        try
        {
            var result = await _service.SubmitDispatchAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/workflow/arrive")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<OrderDetailDto>> ConfirmArrival(int id, [FromBody] ConfirmArrivalDto dto)
    {
        var result = await _service.ConfirmArrivalAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:int}/workflow/complete")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<OrderDetailDto>> CompleteTransaction(int id, [FromBody] BranchCheckSubmitDto dto)
    {
        try
        {
            var result = await _service.CompleteTransactionAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/workflow/cancel")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<OrderDetailDto>> CancelOrder(int id, [FromBody] CancelOrderDto dto)
    {
        try
        {
            var result = await _service.CancelOrderAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}/messages")]
    public async Task<ActionResult<IEnumerable<OrderMessageDto>>> GetMessages(int id)
    {
        var messages = await _service.GetMessagesAsync(id);
        return Ok(messages);
    }

    [HttpPost("{id:int}/messages")]
    public async Task<ActionResult<OrderMessageDto>> SendMessage(int id, [FromBody] SendMessageDto dto)
    {
        try
        {
            var result = await _service.SendMessageAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
