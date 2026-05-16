using Kettan.Server.DTOs.Auth;
using Kettan.Server.Entities;

namespace Kettan.Server.Services.Auth;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, string? deviceToken, string? userAgent, string? ipAddress);
    Task<LoginResponse?> VerifyMfaAsync(VerifyMfaRequest request, string? userAgent, string? ipAddress);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
}