using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize(Roles = "SuperAdmin")] // Temporarily disable to run easily via browser
public class DebugController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly ApplicationDbContext _context;

    public DebugController(IWebHostEnvironment env, ApplicationDbContext context)
    {
        _env = env;
        _context = context;
    }

    [HttpPost("backfill-transaction-codes")]
    public async Task<IActionResult> BackfillTransactionCodes()
    {
        var transactions = await _context.InventoryTransactions
            .Where(t => string.IsNullOrEmpty(t.TransactionCode))
            .ToListAsync();

        int count = 0;
        foreach (var t in transactions)
        {
            t.TransactionCode = $"TXN-{t.Timestamp:yyyyMM}-{t.TransactionId}";
            count++;
        }

        if (count > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = $"Successfully backfilled {count} transactions." });
    }

    [HttpGet("error-log")]
    public IActionResult GetErrorLog()
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var logPath = Path.Combine(_env.ContentRootPath, "seed_error.txt");
        if (!System.IO.File.Exists(logPath))
        {
            return NotFound("No error log file found. The app might have started successfully or crashed before writing the log.");
        }

        var content = System.IO.File.ReadAllText(logPath);
        return Content(content, "text/plain");
    }

    [HttpGet("clear-log")]
    public IActionResult ClearLog()
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var logPath = Path.Combine(_env.ContentRootPath, "seed_error.txt");
        if (System.IO.File.Exists(logPath))
        {
            System.IO.File.Delete(logPath);
            return Ok("Log cleared.");
        }
        return Ok("No log to clear.");
    }
}
