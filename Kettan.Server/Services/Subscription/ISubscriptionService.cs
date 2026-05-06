using Kettan.Server.DTOs.Subscription;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.Subscription;

public interface ISubscriptionService
{
    Task<RequestOtpResponse> RequestOtpAsync(RequestOtpRequest request, CancellationToken cancellationToken = default);
    Task<RequestOtpResponse> ResendOtpAsync(RequestOtpRequest request, CancellationToken cancellationToken = default);
    Task<VerifyOtpResponse> VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default);
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SubscriptionPlanDto>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<SubscriptionStatusResponse?> GetStatusAsync(string sessionReference, CancellationToken cancellationToken = default);
    Task HandleWebhookAsync(
        PayMongoWebhookPayload payload,
        string? signature,
        CancellationToken cancellationToken = default);

    Task<CheckoutSessionResponse> CreateCheckoutSessionAsync(CreateCheckoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<CurrentSubscriptionResponse> GetCurrentSubscriptionAsync(int tenantId, CancellationToken cancellationToken = default);
    Task<CurrentSubscriptionResponse> UpdateBillingCycleAsync(int tenantId, BillingCycle billingCycle, CancellationToken cancellationToken = default);
    Task CancelSubscriptionAsync(int tenantId, CancellationToken cancellationToken = default);
}
