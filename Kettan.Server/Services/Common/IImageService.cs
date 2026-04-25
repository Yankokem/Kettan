using Microsoft.AspNetCore.Http;

namespace Kettan.Server.Services.Common;

public interface IImageService
{
    /// <summary>
    /// Uploads an image to the cloud storage and returns the secure URL.
    /// Supports overwriting an existing image if a publicId is provided.
    /// </summary>
    /// <param name="file">The image file to upload.</param>
    /// <param name="existingPublicId">Optional. The public ID of the existing image to overwrite.</param>
    /// <returns>A tuple containing the SecureUrl and the PublicId of the uploaded image.</returns>
    Task<(string SecureUrl, string PublicId)> UploadImageAsync(IFormFile file, string? existingPublicId = null);

    /// <summary>
    /// Deletes an image from cloud storage using its public ID.
    /// </summary>
    /// <param name="publicId">The public ID of the image.</param>
    /// <returns>A boolean indicating success.</returns>
    Task<bool> DeleteImageAsync(string publicId);
}
