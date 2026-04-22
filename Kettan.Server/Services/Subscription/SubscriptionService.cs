using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Subscription;
using Kettan.Server.Entities;
using Kettan.Server.Services.Email;
using System.Net.Http.Json;

namespace Kettan.Server.Services.Subscription;

public class SubscriptionService : ISubscriptionService
{
    private const int OtpExpiryMinutes = 10;
    private const int OtpCooldownSeconds = 60;
    private const int OtpMaxAttempts = 5;
    private const int OtpMaxResends = 3;
    private const int VerificationSessionMinutes = 30;

    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public SubscriptionService(
        ApplicationDbContext context,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<RequestOtpResponse> RequestOtpAsync(
        RequestOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        await EnsureEmailNotRegisteredAsync(normalizedEmail, cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var otpRecord = await GetLatestActiveOtpAsync(normalizedEmail, cancellationToken);

        if (otpRecord != null
            && otpRecord.ExpiresAtUtc > nowUtc
            && otpRecord.CooldownUntilUtc > nowUtc)
        {
            var remainingSeconds = Math.Max(1, (int)Math.Ceiling((otpRecord.CooldownUntilUtc - nowUtc).TotalSeconds));
            throw new InvalidOperationException($"Please wait {remainingSeconds} seconds before requesting a new code.");
        }

        var otpCode = GenerateOtpCode();
        if (otpRecord == null || otpRecord.IsUsed || otpRecord.ExpiresAtUtc <= nowUtc)
        {
            otpRecord = new RegistrationOtp
            {
                Email = normalizedEmail,
                OtpHash = BCrypt.Net.BCrypt.HashPassword(otpCode),
                ExpiresAtUtc = nowUtc.AddMinutes(OtpExpiryMinutes),
                CooldownUntilUtc = nowUtc.AddSeconds(OtpCooldownSeconds),
                AttemptCount = 0,
                ResendCount = 0,
                IsUsed = false,
                UpdatedAtUtc = nowUtc,
            };

            _context.RegistrationOtps.Add(otpRecord);
        }
        else
        {
            otpRecord.OtpHash = BCrypt.Net.BCrypt.HashPassword(otpCode);
            otpRecord.ExpiresAtUtc = nowUtc.AddMinutes(OtpExpiryMinutes);
            otpRecord.CooldownUntilUtc = nowUtc.AddSeconds(OtpCooldownSeconds);
            otpRecord.AttemptCount = 0;
            otpRecord.ResendCount = 0;
            otpRecord.IsUsed = false;
            otpRecord.VerifiedAtUtc = null;
            otpRecord.UpdatedAtUtc = nowUtc;
        }

        await InvalidateVerificationSessionsAsync(normalizedEmail, nowUtc, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendRegistrationOtpEmailAsync(
            normalizedEmail,
            otpCode,
            OtpExpiryMinutes,
            cancellationToken);

        return new RequestOtpResponse
        {
            Email = normalizedEmail,
            ExpiresAtUtc = otpRecord.ExpiresAtUtc,
            CooldownSeconds = OtpCooldownSeconds,
            RemainingResends = OtpMaxResends,
        };
    }

    public async Task<RequestOtpResponse> ResendOtpAsync(
        RequestOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        await EnsureEmailNotRegisteredAsync(normalizedEmail, cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var otpRecord = await GetLatestActiveOtpAsync(normalizedEmail, cancellationToken);
        if (otpRecord == null || otpRecord.IsUsed || otpRecord.ExpiresAtUtc <= nowUtc)
        {
            throw new InvalidOperationException("Your OTP session expired. Request a new code.");
        }

        if (otpRecord.CooldownUntilUtc > nowUtc)
        {
            var remainingSeconds = Math.Max(1, (int)Math.Ceiling((otpRecord.CooldownUntilUtc - nowUtc).TotalSeconds));
            throw new InvalidOperationException($"Please wait {remainingSeconds} seconds before requesting a new code.");
        }

        if (otpRecord.ResendCount >= OtpMaxResends)
        {
            throw new InvalidOperationException("Maximum resend attempts reached. Start again with your email.");
        }

        var otpCode = GenerateOtpCode();
        otpRecord.OtpHash = BCrypt.Net.BCrypt.HashPassword(otpCode);
        otpRecord.ExpiresAtUtc = nowUtc.AddMinutes(OtpExpiryMinutes);
        otpRecord.CooldownUntilUtc = nowUtc.AddSeconds(OtpCooldownSeconds);
        otpRecord.AttemptCount = 0;
        otpRecord.ResendCount += 1;
        otpRecord.UpdatedAtUtc = nowUtc;

        await InvalidateVerificationSessionsAsync(normalizedEmail, nowUtc, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendRegistrationOtpEmailAsync(
            normalizedEmail,
            otpCode,
            OtpExpiryMinutes,
            cancellationToken);

        return new RequestOtpResponse
        {
            Email = normalizedEmail,
            ExpiresAtUtc = otpRecord.ExpiresAtUtc,
            CooldownSeconds = OtpCooldownSeconds,
            RemainingResends = Math.Max(0, OtpMaxResends - otpRecord.ResendCount),
        };
    }

    public async Task<VerifyOtpResponse> VerifyOtpAsync(
        VerifyOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var nowUtc = DateTime.UtcNow;

        var otpRecord = await GetLatestActiveOtpAsync(normalizedEmail, cancellationToken);
        if (otpRecord == null || otpRecord.IsUsed)
        {
            throw new InvalidOperationException("No active OTP session found. Request a new code.");
        }

        if (otpRecord.ExpiresAtUtc <= nowUtc)
        {
            otpRecord.IsUsed = true;
            otpRecord.UpdatedAtUtc = nowUtc;
            await _context.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("The OTP code expired. Request a new one.");
        }

        if (otpRecord.AttemptCount >= OtpMaxAttempts)
        {
            otpRecord.IsUsed = true;
            otpRecord.UpdatedAtUtc = nowUtc;
            await _context.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Maximum verification attempts reached. Request a new code.");
        }

        otpRecord.AttemptCount += 1;
        var isValid = BCrypt.Net.BCrypt.Verify(request.OtpCode.Trim(), otpRecord.OtpHash);
        if (!isValid)
        {
            if (otpRecord.AttemptCount >= OtpMaxAttempts)
            {
                otpRecord.IsUsed = true;
            }

            otpRecord.UpdatedAtUtc = nowUtc;
            await _context.SaveChangesAsync(cancellationToken);

            var remainingAttempts = Math.Max(0, OtpMaxAttempts - otpRecord.AttemptCount);
            if (remainingAttempts == 0)
            {
                throw new InvalidOperationException("Maximum verification attempts reached. Request a new code.");
            }

            throw new InvalidOperationException($"Invalid OTP code. {remainingAttempts} attempt(s) remaining.");
        }

        otpRecord.IsUsed = true;
        otpRecord.VerifiedAtUtc = nowUtc;
        otpRecord.UpdatedAtUtc = nowUtc;

        await InvalidateVerificationSessionsAsync(normalizedEmail, nowUtc, cancellationToken);

        var verificationToken = $"reg_{Guid.NewGuid():N}";
        var verificationSession = new RegistrationVerificationSession
        {
            Email = normalizedEmail,
            VerificationToken = verificationToken,
            ExpiresAtUtc = nowUtc.AddMinutes(VerificationSessionMinutes),
            IsUsed = false,
        };

        _context.RegistrationVerificationSessions.Add(verificationSession);
        await _context.SaveChangesAsync(cancellationToken);

        return new VerifyOtpResponse
        {
            Email = normalizedEmail,
            VerificationToken = verificationToken,
            SessionExpiresAtUtc = verificationSession.ExpiresAtUtc,
        };
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (!ValidatePasswordComplexity(request.Password))
        {
            throw new InvalidOperationException("Password must be at least 8 characters, contain an uppercase letter, a number, and a special character.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var requestedPlanCode = request.PlanCode.Trim().ToUpperInvariant();

        var nowUtc = DateTime.UtcNow;
        var verificationSession = await _context.RegistrationVerificationSessions
            .FirstOrDefaultAsync(
                s => s.VerificationToken == request.VerificationToken && !s.IsUsed,
                cancellationToken);

        if (verificationSession == null
            || verificationSession.ExpiresAtUtc <= nowUtc
            || !string.Equals(verificationSession.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid or expired verification session. Verify your OTP again.");
        }

        var existingUser = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            throw new InvalidOperationException("Email already registered.");
        }

        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(
                p => p.PlanCode == requestedPlanCode && p.IsActive,
                cancellationToken);

        if (plan == null)
        {
            throw new InvalidOperationException("Selected plan is invalid or unavailable.");
        }

        var periodEnd = nowUtc.AddMonths(1);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var tenant = new Tenant
        {
            Name = request.CompanyName.Trim(),
            Email = normalizedEmail,
            Phone = request.PhoneContact.Trim(),
            Address = request.HeadquartersAddress.Trim(),
            IsActive = true, // Set to true so they can login (but SubscriptionStatus blocks API access until paid)
            SubscriptionTier = plan.Name,
            SubscriptionStatus = "PendingPayment",
            SubscriptionPeriodStart = null,
            SubscriptionPeriodEnd = null,
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(cancellationToken);

        var (firstName, lastName) = SplitFullName(request.FullName);
        var adminUser = new User
        {
            TenantId = tenant.TenantId,
            FirstName = firstName,
            LastName = lastName,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "TenantAdmin",
            IsActive = true, // Ensure the user can log in immediately and finish payment from dashboard if needed
        };

        var tenantSubscription = new TenantSubscription
        {
            TenantId = tenant.TenantId,
            PlanId = plan.PlanId,
            Status = "PendingPayment",
            BillingCycle = "Monthly",
            StartDate = nowUtc,
            PeriodStart = nowUtc,
            PeriodEnd = periodEnd,
            AutoRenew = true,
            UpdatedAt = nowUtc,
        };

        _context.Users.Add(adminUser);
        _context.TenantSubscriptions.Add(tenantSubscription);
        await _context.SaveChangesAsync(cancellationToken);

        tenant.CurrentSubscriptionId = tenantSubscription.TenantSubscriptionId;

        var providerReference = $"chk_{Guid.NewGuid():N}";
        var invoice = new SubscriptionInvoice
        {
            TenantSubscriptionId = tenantSubscription.TenantSubscriptionId,
            InvoiceNumber = $"INV-{nowUtc:yyyyMMdd}-{Guid.NewGuid():N}"[..24],
            AmountDue = plan.PriceMonthly,
            Currency = "PHP",
            Status = "Pending",
            IssuedAt = nowUtc,
            DueAt = nowUtc.AddDays(1),
            ProviderReference = providerReference,
        };

        _context.SubscriptionInvoices.Add(invoice);

        verificationSession.IsUsed = true;
        verificationSession.UsedAtUtc = nowUtc;

        await _context.SaveChangesAsync(cancellationToken);

        var checkoutResponse = await GeneratePayMongoCheckoutAsync(plan, providerReference, normalizedEmail, cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new RegisterResponse
        {
            TenantId = tenant.TenantId,
            RegistrationCompleted = true,
            Message = "Registration recorded. Please complete your payment.",
            CheckoutUrl = checkoutResponse.CheckoutUrl
        };
    }

    public async Task<IReadOnlyList<SubscriptionPlanDto>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.PriceMonthly)
            .Select(p => new SubscriptionPlanDto
            {
                PlanId = p.PlanId,
                PlanCode = p.PlanCode,
                Name = p.Name,
                Description = p.Description,
                PriceMonthly = p.PriceMonthly,
                PriceYearly = p.PriceYearly,
                BranchLimit = p.BranchLimit,
                UserLimit = p.UserLimit,
            })
            .ToListAsync(cancellationToken);

        return plans;
    }

    public async Task<SubscriptionStatusResponse?> GetStatusAsync(
        string sessionReference,
        CancellationToken cancellationToken = default)
    {
        var invoice = await _context.SubscriptionInvoices
            .Include(i => i.TenantSubscription)
            .ThenInclude(ts => ts!.Tenant)
            .FirstOrDefaultAsync(i => i.ProviderReference == sessionReference, cancellationToken);

        if (invoice == null)
        {
            return null;
        }

        var tenant = invoice.TenantSubscription?.Tenant;
        return new SubscriptionStatusResponse
        {
            CheckoutSessionReference = sessionReference,
            Status = invoice.Status,
            IsTenantActive = tenant?.IsActive ?? false,
            TenantSubscriptionStatus = invoice.TenantSubscription?.Status,
        };
    }

    public async Task HandleWebhookAsync(
        PayMongoWebhookPayload payload,
        string? signature,
        CancellationToken cancellationToken = default)
    {
        var providerReference = payload.ProviderReference.Trim();
        if (string.IsNullOrWhiteSpace(providerReference))
        {
            throw new InvalidOperationException("ProviderReference is required.");
        }

        // Placeholder verification while PayMongo signature integration is still pending.
        if (string.IsNullOrWhiteSpace(signature))
        {
            Console.WriteLine("[WEBHOOK] Signature missing. Proceeding in development mode.");
        }

        var invoice = await _context.SubscriptionInvoices
            .Include(i => i.TenantSubscription)
            .ThenInclude(ts => ts!.Tenant)
            .Include(i => i.TenantSubscription)
            .ThenInclude(ts => ts!.Plan)
            .FirstOrDefaultAsync(i => i.ProviderReference == providerReference, cancellationToken);

        if (invoice == null)
        {
            throw new InvalidOperationException("Subscription session not found.");
        }

        var normalizedStatus = payload.Status.Trim().ToLowerInvariant();
        var paidAt = payload.PaidAtUtc ?? DateTime.UtcNow;

        if (normalizedStatus == "paid")
        {
            var providerPaymentId = string.IsNullOrWhiteSpace(payload.ProviderPaymentId)
                ? $"pay_{providerReference}"
                : payload.ProviderPaymentId.Trim();

            var alreadyProcessed = await _context.SubscriptionPayments
                .AnyAsync(p => p.ProviderPaymentId == providerPaymentId, cancellationToken);

            if (alreadyProcessed)
            {
                return;
            }

            _context.SubscriptionPayments.Add(new SubscriptionPayment
            {
                InvoiceId = invoice.InvoiceId,
                Amount = invoice.AmountDue,
                Currency = invoice.Currency,
                PaymentMethod = "Checkout",
                Provider = "PayMongo",
                ProviderPaymentId = providerPaymentId,
                Status = "Paid",
                PaidAt = paidAt,
            });

            invoice.Status = "Paid";
            invoice.PaidAt = paidAt;

            var tenantSubscription = invoice.TenantSubscription;
            if (tenantSubscription != null)
            {
                tenantSubscription.Status = "Active";
                tenantSubscription.PeriodStart = paidAt;
                tenantSubscription.PeriodEnd = paidAt.AddMonths(1);
                tenantSubscription.UpdatedAt = DateTime.UtcNow;

                var tenant = tenantSubscription.Tenant;
                if (tenant != null)
                {
                    tenant.IsActive = true;
                    tenant.SubscriptionStatus = "Active";
                    tenant.SubscriptionTier = tenantSubscription.Plan?.Name ?? tenant.SubscriptionTier;
                    tenant.SubscriptionPeriodStart = tenantSubscription.PeriodStart;
                    tenant.SubscriptionPeriodEnd = tenantSubscription.PeriodEnd;
                    tenant.CurrentSubscriptionId = tenantSubscription.TenantSubscriptionId;

                    // Activate all users associated with this newly active tenant
                    var tenantUsers = await _context.Users
                        .Where(u => u.TenantId == tenant.TenantId)
                        .ToListAsync(cancellationToken);
                        
                    foreach (var user in tenantUsers)
                    {
                        user.IsActive = true;
                    }

                    if (!string.IsNullOrWhiteSpace(tenant.Email))
                    {
                        var frontendBaseUrl = _configuration["Onboarding:FrontendBaseUrl"]?.TrimEnd('/')
                            ?? "https://localhost:61643";
                        await _emailService.SendWelcomeEmailAsync(
                            tenant.Email,
                            tenant.Name,
                            $"{frontendBaseUrl}/login",
                            cancellationToken);
                    }
                }
            }
        }
        else if (normalizedStatus == "failed")
        {
            invoice.Status = "Failed";
        }
        else
        {
            invoice.Status = "Pending";
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<CheckoutSessionResponse> CreateCheckoutSessionAsync(
        CreateCheckoutSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.PlanId == request.PlanId && p.IsActive, cancellationToken);

        if (plan == null)
        {
            throw new InvalidOperationException("Selected plan is invalid or unavailable.");
        }

        return await GeneratePayMongoCheckoutAsync(plan, $"chk_session_{Guid.NewGuid():N}", request.Email, cancellationToken);
    }

    private async Task<CheckoutSessionResponse> GeneratePayMongoCheckoutAsync(
        SubscriptionPlan plan,
        string referenceNumber,
        string email,
        CancellationToken cancellationToken)
    {
        var secretKey = _configuration["PayMongo:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("PayMongo configuration is missing.");
        }

        var frontendBaseUrl = _configuration["Onboarding:FrontendBaseUrl"]?.TrimEnd('/')
            ?? "https://localhost:61643";

        var payload = new
        {
            data = new
            {
                attributes = new
                {
                    send_email_receipt = true,
                    show_description = true,
                    show_line_items = true,
                    line_items = new[]
                    {
                        new
                        {
                            currency = "PHP",
                            amount = (int)(plan.PriceMonthly * 100),
                            description = plan.Description ?? "Monthly Subscription",
                            name = plan.Name,
                            quantity = 1
                        }
                    },
                    payment_method_types = new[] { "card", "gcash", "paymaya" },
                    success_url = $"{frontendBaseUrl}/market/register/success",
                    cancel_url = $"{frontendBaseUrl}/market/register",
                    description = $"Subscription for {plan.Name}",
                    reference_number = referenceNumber,
                    billing = new { email = email }
                }
            }
        };

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes(secretKey + ":")));

        var response = await client.PostAsJsonAsync("https://api.paymongo.com/v1/checkout_sessions", payload, cancellationToken);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Failed to create checkout session: {errorBody}");
        }

        using var jsonDoc = await System.Text.Json.JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), default, cancellationToken);
        var data = jsonDoc.RootElement.GetProperty("data");
        var attributes = data.GetProperty("attributes");
        var checkoutUrl = attributes.GetProperty("checkout_url").GetString()!;
        var sessionId = data.GetProperty("id").GetString()!;

        return new CheckoutSessionResponse
        {
            SessionId = sessionId,
            CheckoutUrl = checkoutUrl
        };
    }

    public async Task CancelSubscriptionAsync(int tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .Include(t => t.CurrentSubscription)
            .FirstOrDefaultAsync(t => t.TenantId == tenantId, cancellationToken);

        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found.");
        }

        tenant.SubscriptionStatus = "Canceled";
        if (tenant.CurrentSubscription != null)
        {
            tenant.CurrentSubscription.Status = "Canceled";
            tenant.CurrentSubscription.AutoRenew = false;
            tenant.CurrentSubscription.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static (string FirstName, string LastName) SplitFullName(string fullName)
    {
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
        {
            return ("Owner", "Admin");
        }

        if (parts.Length == 1)
        {
            return (parts[0], parts[0]);
        }

        return (parts[0], string.Join(" ", parts.Skip(1)));
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static bool ValidatePasswordComplexity(string password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8) return false;
        if (!password.Any(char.IsUpper)) return false;
        if (!password.Any(char.IsDigit)) return false;
        if (!password.Any(ch => !char.IsLetterOrDigit(ch))) return false;
        return true;
    }

    private async Task EnsureEmailNotRegisteredAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            throw new InvalidOperationException("Email already registered.");
        }
    }

    private async Task<RegistrationOtp?> GetLatestActiveOtpAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        return await _context.RegistrationOtps
            .Where(o => o.Email == normalizedEmail)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task InvalidateVerificationSessionsAsync(
        string normalizedEmail,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var activeSessions = await _context.RegistrationVerificationSessions
            .Where(s => s.Email == normalizedEmail && !s.IsUsed)
            .ToListAsync(cancellationToken);

        foreach (var activeSession in activeSessions)
        {
            activeSession.IsUsed = true;
            activeSession.UsedAtUtc = nowUtc;
        }
    }

    private static string GenerateOtpCode()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString("D6");
    }
}
