namespace Kettan.Server.DTOs.Subscription;

public class CurrentSubscriptionResponse
{
    public int TenantId { get; set; }
    public string PlanCode { get; set; } = "STARTER";
    public string PlanName { get; set; } = "Starter";
    public int? BranchLimit { get; set; }
    public int? UserLimit { get; set; }
    public int UsersPerBranchLimit { get; set; } = 5;
    public int ActiveBranches { get; set; }
    public int ActiveUsers { get; set; }
    public string Status { get; set; } = "Active";
    public string BillingCycle { get; set; } = "Monthly";
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public DateTime? NextBillingDate { get; set; }
    public bool AutoRenew { get; set; }
    public DateTime? CanceledAt { get; set; }
    public bool IsReadOnly { get; set; }
    public string? LatestInvoiceStatus { get; set; }
    public DateTime? LatestInvoiceDueAt { get; set; }
    public decimal? LatestInvoiceAmountDue { get; set; }
    public string? LatestPaymentStatus { get; set; }
    public DateTime? LatestPaidAt { get; set; }
    public string PaymentProvider { get; set; } = "PayMongo";
}

