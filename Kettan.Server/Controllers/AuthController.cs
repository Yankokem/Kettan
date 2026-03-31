using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Auth;
using Kettan.Server.Services.Auth;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var token = await _authService.LoginAsync(request);

        if (token == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        // Return JWT in HttpOnly Cookie for security against XSS
        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Set to true to enforce HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(1440)
        });

        return Ok(new { message = "Login successful" });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt");
        return Ok(new { message = "Logged out successfully" });
    }
}