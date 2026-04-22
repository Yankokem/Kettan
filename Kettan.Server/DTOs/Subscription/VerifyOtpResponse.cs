namespace Kettan.Server.DTOs.Subscription;

public class VerifyOtpResponse
{
    public required string Email { get; set; }
    public required string VerificationToken { get; set; }
    public DateTime SessionExpiresAtUtc { get; set; }
}
