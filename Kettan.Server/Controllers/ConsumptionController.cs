using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Consumption;
using Kettan.Server.Services.BranchOperations;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsumptionController : ControllerBase
{
    private readonly IConsumptionService _service;

    public ConsumptionController(IConsumptionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ConsumptionLogDto>>> GetLogs(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? method = null)
    {
        var rows = await _service.ListAsync(from, to, method);
        return Ok(rows);
    }

    [HttpPost("sales")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ConsumptionLogDto>> LogSales([FromBody] LogSalesConsumptionDto dto)
    {
        try
        {
            var result = await _service.LogSalesAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("direct")]
    [Authorize(Roles = "BranchManager,BranchOwner")]
    public async Task<ActionResult<ConsumptionLogDto>> LogDirect([FromBody] LogDirectConsumptionDto dto)
    {
        try
        {
            var result = await _service.LogDirectAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
