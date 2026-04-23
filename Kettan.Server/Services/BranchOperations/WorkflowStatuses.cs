namespace Kettan.Server.Services.BranchOperations;

public static class SupplyRequestStatuses
{
    public const string Draft = "Draft";
    public const string AutoDrafted = "AutoDrafted";
    public const string PendingApproval = "PendingApproval";
    public const string Approved = "Approved";
    public const string PartiallyApproved = "PartiallyApproved";
    public const string Rejected = "Rejected";
}

public static class OrderStatuses
{
    public const string Processing = "Processing";
    public const string Picking = "Picking";
    public const string Packed = "Packed";
    public const string Dispatched = "Dispatched";
    public const string InTransit = "InTransit";
    public const string Delivered = "Delivered";
    public const string DeliveredWithVariance = "DeliveredWithVariance";
    public const string Returned = "Returned";
}
