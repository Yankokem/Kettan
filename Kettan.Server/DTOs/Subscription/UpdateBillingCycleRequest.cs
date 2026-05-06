using System.ComponentModel.DataAnnotations;
using Kettan.Server.Enums;

namespace Kettan.Server.DTOs.Subscription;

public class UpdateBillingCycleRequest
{
    [Required]
    [EnumDataType(typeof(BillingCycle))]
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
}

