namespace Kettan.Server.DTOs.Subscription;

public class RequestOtpResponse
{
    public required string Email { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public int CooldownSeconds { get; set; }
    public int RemainingResends { get; set; }
}
