namespace Kettan.Server.DTOs.Subscription;

public class RegisterResponse
{
    public int TenantId { get; set; }
    public bool RegistrationCompleted { get; set; }
    public required string Message { get; set; }
    public string? CheckoutUrl { get; set; }
}
