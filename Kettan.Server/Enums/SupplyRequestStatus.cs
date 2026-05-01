namespace Kettan.Server.Enums;

public enum SupplyRequestStatus : byte
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    PartiallyApproved = 3,
    Rejected = 4,
    Cancelled = 5,
    AutoDrafted = 6,
    Fulfilled = 7,
    Pending = 8 // For backward compatibility/migration purposes if needed
}
