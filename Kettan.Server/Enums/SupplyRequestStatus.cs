namespace Kettan.Server.Enums;

public enum SupplyRequestStatus : byte
{
    Draft = 0,              // Used in code, maps to Pending in SQL
    Pending = 0,            // SQL migration value
    PendingApproval = 1,    // Used in code, maps to Approved in SQL
    Approved = 1,           // SQL migration value
    PartiallyApproved = 2,  // Used in code, maps to Rejected in SQL (temporary)
    Rejected = 2,           // SQL migration value
    Cancelled = 3,          // SQL migration value
    AutoDrafted = 4,        // Used in code, maps to Fulfilled in SQL
    Fulfilled = 4           // SQL migration value
}
