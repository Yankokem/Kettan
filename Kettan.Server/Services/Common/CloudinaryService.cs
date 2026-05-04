using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kettan.Server.Services.Common;

public class CloudinaryService : IImageService
{
    private readonly Cloudinary _cloudinary;
    private const long MaxFileSizeInBytes = 5 * 1024 * 1024; // 5MB

    public CloudinaryService(IConfiguration config)
    {
        var cloudinaryUrl = config["Cloudinary:Url"];
        if (string.IsNullOrEmpty(cloudinaryUrl))
        {
            throw new ArgumentException("Cloudinary URL is not configured.");
        }

        _cloudinary = new Cloudinary(cloudinaryUrl);
        _cloudinary.Api.Secure = true;
    }

    public async Task<(string SecureUrl, string PublicId)> UploadImageAsync(IFormFile file, string? existingPublicId = null, string? folder = null)
    {
        if (file.Length > MaxFileSizeInBytes)
        {
            throw new ArgumentException("File size exceeds the 5MB limit.");
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException("Invalid file type. Allowed types are JPG, JPEG, PNG, WEBP.");
        }

        var uploadResult = new ImageUploadResult();

        if (file.Length > 0)
        {
            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Transformation = new Transformation().Quality("auto").FetchFormat("auto"),
                Folder = folder
            };

            // If an existing public ID is provided, Cloudinary will overwrite it.
            if (!string.IsNullOrEmpty(existingPublicId))
            {
                uploadParams.PublicId = existingPublicId;
                uploadParams.Overwrite = true;
            }

            uploadResult = await _cloudinary.UploadAsync(uploadParams);
        }

        if (uploadResult.Error != null)
        {
            throw new Exception(uploadResult.Error.Message);
        }

        return (uploadResult.SecureUrl.ToString(), uploadResult.PublicId);
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);

        return result.Result == "ok";
    }
}
