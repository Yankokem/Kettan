using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class DebugController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public DebugController(IWebHostEnvironment env)
    {
        _env = env;
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
