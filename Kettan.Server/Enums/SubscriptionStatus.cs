namespace Kettan.Server.Enums;

public enum SubscriptionStatus : byte
{
    Active = 0,
    Trialing = 1,
    PastDue = 2,
    Cancelled = 3,
    Canceled = 3,       // Alias for Cancelled (US spelling)
    Expired = 4,
    Suspended = 5,
    PendingPayment = 6
}
