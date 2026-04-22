using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Kettan.Server.DTOs.Subscription;
using Kettan.Server.Services.Subscription;
using Microsoft.AspNetCore.Authorization;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<SubscriptionPlanDto>>> GetPlans(CancellationToken cancellationToken)
    {
        var plans = await _subscriptionService.GetPlansAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpPost("request-otp")]
    [EnableRateLimiting("OtpRequestRateLimit")]
    public async Task<ActionResult<RequestOtpResponse>> RequestOtp(
        [FromBody] RequestOtpRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var response = await _subscriptionService.RequestOtpAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return MapOtpException(ex);
        }
    }

    [HttpPost("resend-otp")]
    [EnableRateLimiting("OtpRequestRateLimit")]
    public async Task<ActionResult<RequestOtpResponse>> ResendOtp(
        [FromBody] RequestOtpRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var response = await _subscriptionService.ResendOtpAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return MapOtpException(ex);
        }
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<VerifyOtpResponse>> VerifyOtp(
        [FromBody] VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var response = await _subscriptionService.VerifyOtpAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return MapOtpException(ex);
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var response = await _subscriptionService.RegisterAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("status/{sessionReference}")]
    public async Task<ActionResult<SubscriptionStatusResponse>> GetStatus(
        string sessionReference,
        CancellationToken cancellationToken)
    {
        var result = await _subscriptionService.GetStatusAsync(sessionReference, cancellationToken);
        if (result == null)
        {
            return NotFound(new { message = "Subscription session not found." });
        }

        return Ok(result);
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(
        [FromBody] PayMongoWebhookPayload payload,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var signature = Request.Headers["X-PayMongo-Signature"].FirstOrDefault();

        try
        {
            await _subscriptionService.HandleWebhookAsync(payload, signature, cancellationToken);
            return Ok(new { message = "Webhook processed." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("checkout-session")]
    public async Task<ActionResult<CheckoutSessionResponse>> CreateCheckoutSession(
        [FromBody] CreateCheckoutSessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var response = await _subscriptionService.CreateCheckoutSessionAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "TenantAdmin")]
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscription(
        [FromServices] Kettan.Server.Services.Common.ICurrentUserService currentUserService,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            await _subscriptionService.CancelSubscriptionAsync(currentUserService.TenantId.Value, cancellationToken);
            return Ok(new { message = "Subscription canceled successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private ActionResult MapOtpException(InvalidOperationException ex)
    {
        var message = ex.Message;
        if (message.Contains("Please wait", StringComparison.OrdinalIgnoreCase)
            || message.Contains("Maximum", StringComparison.OrdinalIgnoreCase)
            || message.Contains("attempt", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message });
        }

        return BadRequest(new { message });
    }
}
