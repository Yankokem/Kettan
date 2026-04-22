namespace Kettan.Server.DTOs.Subscription;

public class CheckoutSessionResponse
{
    public required string SessionId { get; set; }
    public required string CheckoutUrl { get; set; }
}
