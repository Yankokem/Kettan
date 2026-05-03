using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Returns;
using Kettan.Server.Services.BranchOperations;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReturnsController : ControllerBase
{
    private readonly IReturnService _service;

    public ReturnsController(IReturnService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReturnDto>>> GetReturns([FromQuery] string? status = null, [FromQuery] string? resolution = null)
    {
        var rows = await _service.ListAsync(status, resolution);
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ReturnDto>> GetReturn(int id)
    {
        var row = await _service.GetByIdAsync(id);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    [HttpGet("eligible-orders")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<List<ReturnEligibleOrderDto>>> GetEligibleOrders()
    {
        var rows = await _service.GetEligibleOrdersAsync();
        return Ok(rows);
    }

    [HttpGet("eligible-orders/{orderId:int}")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ReturnEligibleOrderDto>> GetEligibleOrderDetail(int orderId)
    {
        var row = await _service.GetEligibleOrderDetailAsync(orderId);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    [HttpPost("drafts")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ReturnDto>> CreateDraft([FromBody] CreateReturnDraftDto dto)
    {
        try
        {
            var created = await _service.CreateDraftAsync(dto);
            return CreatedAtAction(nameof(GetReturn), new { id = created.ReturnId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}/draft")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ReturnDto>> UpdateDraft(int id, [FromBody] UpdateReturnDraftDto dto)
    {
        try
        {
            var updated = await _service.UpdateDraftAsync(id, dto);
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ReturnDto>> SubmitReturn(int id, [FromBody] SubmitReturnDto? dto = null)
    {
        try
        {
            var updated = await _service.SubmitAsync(id, dto ?? new SubmitReturnDto());
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/acknowledge")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> AcknowledgeReturn(int id, [FromBody] AcknowledgeReturnDto dto)
    {
        try
        {
            var updated = await _service.AcknowledgeAsync(id, dto);
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> RejectReturn(int id, [FromBody] RejectReturnDto dto)
    {
        try
        {
            var updated = await _service.RejectAsync(id, dto);
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/reschedule")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> ReschedulePickup(int id, [FromBody] RescheduleReturnPickupDto dto)
    {
        try
        {
            var updated = await _service.ReschedulePickupAsync(id, dto);
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/dispatch")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ReturnDto>> ConfirmDispatch(int id, [FromBody] ConfirmReturnDispatchDto? dto = null)
    {
        try
        {
            var updated = await _service.ConfirmDispatchAsync(id, dto ?? new ConfirmReturnDispatchDto());
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/arrive")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> ConfirmArrival(int id, [FromBody] ConfirmReturnArrivalDto? dto = null)
    {
        try
        {
            var updated = await _service.ConfirmArrivalAsync(id, dto ?? new ConfirmReturnArrivalDto());
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/inspect/start")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> StartInspection(int id, [FromBody] StartReturnInspectionDto? dto = null)
    {
        try
        {
            var updated = await _service.StartInspectionAsync(id, dto ?? new StartReturnInspectionDto());
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/inspect")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> SaveInspection(int id, [FromBody] SaveReturnInspectionDto dto)
    {
        try
        {
            var updated = await _service.SaveInspectionAsync(id, dto);
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/complete")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnDto>> CompleteReturn(int id, [FromBody] CompleteReturnDto? dto = null)
    {
        try
        {
            var updated = await _service.CompleteAsync(id, dto ?? new CompleteReturnDto());
            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}/messages")]
    public async Task<ActionResult<List<ReturnMessageDto>>> GetMessages(int id)
    {
        var messages = await _service.GetMessagesAsync(id);
        return Ok(messages);
    }

    [HttpPost("{id:int}/messages")]
    public async Task<ActionResult<ReturnMessageDto>> SendMessage(int id, [FromBody] SendReturnMessageDto dto)
    {
        try
        {
            var message = await _service.SendMessageAsync(id, dto);
            if (message == null)
            {
                return NotFound();
            }

            return Ok(message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
