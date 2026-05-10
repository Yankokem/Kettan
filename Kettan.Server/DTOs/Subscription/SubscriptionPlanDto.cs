namespace Kettan.Server.DTOs.Subscription;

public class SubscriptionPlanDto
{
    public int PlanId { get; set; }
    public required string PlanCode { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal PriceMonthly { get; set; }
    public int? BranchLimit { get; set; }
    public int? UserLimit { get; set; }
}
