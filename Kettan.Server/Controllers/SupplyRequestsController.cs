using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.SupplyRequests;
using Kettan.Server.Services.BranchOperations;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupplyRequestsController : ControllerBase
{
    private readonly ISupplyRequestService _service;

    public SupplyRequestsController(ISupplyRequestService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupplyRequestDto>>> GetSupplyRequests([FromQuery] string? status = null)
    {
        var rows = await _service.ListAsync(status);
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SupplyRequestDto>> GetSupplyRequest(int id)
    {
        var row = await _service.GetByIdAsync(id);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    [HttpPost]
    public async Task<ActionResult<SupplyRequestDto>> CreateSupplyRequest([FromBody] CreateSupplyRequestDto dto)
    {
        try
        {
            var created = await _service.CreateDraftAsync(dto);
            return CreatedAtAction(nameof(GetSupplyRequest), new { id = created.RequestId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/submit")]
    public async Task<IActionResult> SubmitSupplyRequest(int id, [FromBody] SubmitSupplyRequestDto? dto = null)
    {
        try
        {
            var updated = await _service.SubmitAsync(id, dto?.Notes);
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
