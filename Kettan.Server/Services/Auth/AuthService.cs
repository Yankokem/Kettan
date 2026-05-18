using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Auth;
using Kettan.Server.Entities;
using Kettan.Server.Enums;
using Kettan.Server.Services.Email;

namespace Kettan.Server.Services.Auth;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    private const int OtpExpiryMinutes = 5;

    public AuthService(
        ApplicationDbContext context,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? deviceToken, string? userAgent, string? ipAddress)
    {
        // Must bypass tenant filter during login since user isn't authenticated yet
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        if (user.Status == EmployeeStatus.Inactive)
        {
            throw new UnauthorizedAccessException("Your account is currently inactive. Please contact your account provider.");
        }

        if (user.Status == EmployeeStatus.Archived)
        {
            throw new UnauthorizedAccessException("Your account has been archived. Please contact your account provider.");
        }

        if ((user.Role == UserRole.BranchManager || user.Role == UserRole.BranchOwner) && !user.BranchId.HasValue)
        {
            throw new UnauthorizedAccessException("Your account is pending assignment to a branch. Please contact your administrator.");
        }

        // Check if device is recognized
        bool isDeviceRecognized = false;
        if (!string.IsNullOrEmpty(deviceToken) && Guid.TryParse(deviceToken, out var parsedToken))
        {
            var device = await _context.UserDevices
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(d => d.UserId == user.UserId && d.DeviceToken == parsedToken);

            if (device != null)
            {
                // Device is recognized — update last used timestamp
                device.LastUsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                isDeviceRecognized = true;
            }
        }

        if (!isDeviceRecognized)
        {
            // New/unrecognized device → require MFA OTP
            var otpCode = GenerateOtp();
            user.OtpHash = BCrypt.Net.BCrypt.HashPassword(otpCode);
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);
            await _context.SaveChangesAsync();

            // Send OTP email
            try
            {
                await _emailService.SendMfaOtpEmailAsync(user.Email, otpCode, OtpExpiryMinutes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send MFA OTP email to {Email}", user.Email);
                // Still return MFA required — user can request resend
            }

            // Return an MFA challenge response with an ephemeral token
            var mfaToken = GenerateMfaToken(user);
            return new LoginResponse
            {
                UserId = user.UserId,
                Email = user.Email,
                RequiresMfa = true,
                MfaToken = mfaToken,
            };
        }

        // Device recognized — proceed with normal login
        var token = GenerateJwtToken(user);
        var fullName = string.Join(
            " ",
            new[] { user.FirstName, user.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        return new LoginResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            Name = fullName,
            Role = user.Role.ToString(),
            Token = token,
            TenantId = user.TenantId,
            BranchId = user.BranchId,
            ImageUrl = user.ImageUrl
        };
    }

    public async Task<LoginResponse?> VerifyMfaAsync(VerifyMfaRequest request, string? userAgent, string? ipAddress)
    {
        // Decode the MFA token to get the user ID
        var userId = ValidateMfaToken(request.MfaToken);
        if (userId == null)
        {
            return null;
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.UserId == userId.Value && u.IsActive);

        if (user == null)
        {
            return null;
        }

        // Validate OTP
        if (string.IsNullOrEmpty(user.OtpHash) || user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
        {
            return null; // OTP expired or not set
        }

        if (!BCrypt.Net.BCrypt.Verify(request.OtpCode, user.OtpHash))
        {
            return null; // Invalid OTP
        }

        // Clear OTP after successful verification
        user.OtpHash = null;
        user.OtpExpiry = null;

        // Register this device as trusted
        var newDeviceToken = Guid.NewGuid();
        _context.UserDevices.Add(new UserDevice
        {
            UserId = user.UserId,
            DeviceToken = newDeviceToken,
            UserAgent = userAgent?.Length > 512 ? userAgent[..512] : userAgent,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();

        // Generate full JWT
        var token = GenerateJwtToken(user);
        var fullName = string.Join(
            " ",
            new[] { user.FirstName, user.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        return new LoginResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            Name = fullName,
            Role = user.Role.ToString(),
            Token = token,
            TenantId = user.TenantId,
            BranchId = user.BranchId,
            ImageUrl = user.ImageUrl,
            RequiresMfa = false,
            MfaToken = newDeviceToken.ToString(), // Return device token so controller can set the cookie
        };
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive && !u.IsDeleted);

        if (user == null)
        {
            // Don't reveal whether the email exists — return true anyway
            return true;
        }

        var otpCode = GenerateOtp();
        user.OtpHash = BCrypt.Net.BCrypt.HashPassword(otpCode);
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendPasswordResetAsync(user.Email, otpCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset OTP to {Email}", user.Email);
        }

        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive && !u.IsDeleted);

        if (user == null)
        {
            return false;
        }

        // Validate OTP
        if (string.IsNullOrEmpty(user.OtpHash) || user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
        {
            return false; // OTP expired or not set
        }

        if (!BCrypt.Net.BCrypt.Verify(request.OtpCode, user.OtpHash))
        {
            return false; // Invalid OTP
        }

        // Update password and clear OTP
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.OtpHash = null;
        user.OtpExpiry = null;
        await _context.SaveChangesAsync();

        return true;
    }

    private string GenerateOtp()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
    }

    /// <summary>
    /// Generate a short-lived token that encodes the user ID for MFA verification.
    /// This is NOT a full JWT — it's an ephemeral, 5-minute token.
    /// </summary>
    private string GenerateMfaToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim("mfa_user_id", user.UserId.ToString()),
            new Claim("purpose", "mfa"),
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Validate the ephemeral MFA token and extract the user ID.
    /// </summary>
    private int? ValidateMfaToken(string mfaToken)
    {
        try
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(mfaToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = securityKey,
            }, out _);

            var purposeClaim = principal.FindFirst("purpose")?.Value;
            if (purposeClaim != "mfa") return null;

            var userIdClaim = principal.FindFirst("mfa_user_id")?.Value;
            return userIdClaim != null && int.TryParse(userIdClaim, out var uid) ? uid : null;
        }
        catch
        {
            return null;
        }
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        if (user.TenantId.HasValue)
        {
            claims.Add(new Claim("TenantId", user.TenantId.Value.ToString()));
        }
        
        if (user.BranchId.HasValue)
        {
            claims.Add(new Claim("BranchId", user.BranchId.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiryInMinutes"]!)),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}