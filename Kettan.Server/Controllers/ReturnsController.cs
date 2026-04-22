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
    public async Task<ActionResult<List<ReturnDto>>> GetReturns([FromQuery] string? resolution = null)
    {
        var rows = await _service.ListAsync(resolution);
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

    [HttpPost]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ReturnDto>> CreateReturn([FromBody] CreateReturnDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetReturn), new { id = created.ReturnId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/resolve")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> ResolveReturn(int id, [FromBody] ResolveReturnDto dto)
    {
        try
        {
            var updated = await _service.ResolveAsync(id, dto);
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
