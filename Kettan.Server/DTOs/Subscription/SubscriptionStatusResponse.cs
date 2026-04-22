namespace Kettan.Server.DTOs.Subscription;

public class SubscriptionStatusResponse
{
    public required string CheckoutSessionReference { get; set; }
    public required string Status { get; set; }
    public bool IsTenantActive { get; set; }
    public string? TenantSubscriptionStatus { get; set; }
}
