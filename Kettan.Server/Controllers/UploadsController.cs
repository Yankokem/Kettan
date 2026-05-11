using Kettan.Server.Data;
using Kettan.Server.Services.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kettan.Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IImageService _imageService;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UploadsController(IImageService imageService, ApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _imageService = imageService;
        _context = context;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Uploads an image and returns its secure URL.
    /// </summary>
    [HttpPost("image")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage(IFormFile file, [FromForm] string? existingPublicId, [FromForm] string? folder)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Message = "No file uploaded." });
        }

        try
        {
            var (secureUrl, publicId) = await _imageService.UploadImageAsync(file, existingPublicId, folder);
            
            _context.AuditLogs.Add(new Entities.AuditLog
            {
                Action = "ImageUploaded",
                ActionCode = "UPLOAD_IMAGE",
                EventCategory = "Media",
                Outcome = "Success",
                Severity = "Info",
                Source = "API",
                EntityName = "File",
                EntityId = publicId,
                TenantId = _currentUserService.TenantId,
                UserId = _currentUserService.UserId,
                BranchId = _currentUserService.BranchId,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = HttpContext.Request.Headers.UserAgent.ToString().Substring(0, Math.Min(HttpContext.Request.Headers.UserAgent.ToString().Length, 512)),
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(new { url = secureUrl, folder })
            });
            await _context.SaveChangesAsync();

            return Ok(new { Url = secureUrl, PublicId = publicId });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred while uploading the image.", Error = ex.Message });
        }
    }

    /// <summary>
    /// Deletes an image from cloud storage by its public ID.
    /// </summary>
    [HttpDelete("image/{publicId}")]
    public async Task<IActionResult> DeleteImage(string publicId)
    {
        if (string.IsNullOrEmpty(publicId))
        {
            return BadRequest(new { Message = "Public ID is required." });
        }

        try
        {
            var success = await _imageService.DeleteImageAsync(publicId);
            if (success)
            {
                return NoContent();
            }
            return BadRequest(new { Message = "Failed to delete the image." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred while deleting the image.", Error = ex.Message });
        }
    }
}
