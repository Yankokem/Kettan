using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Subscription;
using Kettan.Server.Entities;
using Kettan.Server.Services.Email;
using System.Net.Http.Json;
using Kettan.Server.Enums;

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
    private readonly ILogger<SubscriptionService> _logger;

    public SubscriptionService(
        ApplicationDbContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<SubscriptionService> logger)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
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

        var normalizedEmail = NormalizeEmail(request.Email);
        var normalizedBillingEmail = string.IsNullOrWhiteSpace(request.BillingEmail)
            ? normalizedEmail
            : NormalizeEmail(request.BillingEmail);
        var normalizedSupportEmail = string.IsNullOrWhiteSpace(request.SupportEmail)
            ? normalizedBillingEmail
            : NormalizeEmail(request.SupportEmail);

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
            LegalName = request.LegalName.Trim(),
            TaxId = request.TaxId.Trim(),
            Website = NormalizeNullable(request.Website),
            Email = normalizedBillingEmail,
            SupportEmail = normalizedSupportEmail,
            Phone = request.PhoneContact.Trim(),
            Telephone = NormalizeNullable(request.Telephone),
            Address = request.HeadquartersAddress.Trim(),
            IsActive = true,
            SubscriptionTier = Enum.TryParse<SubscriptionTier>(plan.Name, true, out var tier) ? tier : SubscriptionTier.Starter,
            SubscriptionStatus = SubscriptionStatus.Active,
            SubscriptionPeriodStart = nowUtc,
            SubscriptionPeriodEnd = periodEnd,
        };

        var (firstName, lastName) = SplitFullName(request.FullName);
        var adminUser = new User
        {
            Tenant = tenant,
            FirstName = firstName,
            LastName = lastName,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.TenantAdmin,
            IsActive = true,
        };

        var providerReference = $"chk_{Guid.NewGuid():N}";

        // Save tenant and admin first so TenantId exists before creating dependent records.
        _context.Tenants.Add(tenant);
        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync(cancellationToken);

        var tenantSubscription = new TenantSubscription
        {
            TenantId = tenant.TenantId,
            PlanId = plan.PlanId,
            Status = SubscriptionStatus.Active,
            BillingCycle = BillingCycle.Monthly,
            StartDate = nowUtc,
            PeriodStart = nowUtc,
            PeriodEnd = periodEnd,
            AutoRenew = true,
            UpdatedAt = nowUtc,
        };

        _context.TenantSubscriptions.Add(tenantSubscription);
        await _context.SaveChangesAsync(cancellationToken);

        var invoice = new SubscriptionInvoice
        {
            TenantSubscriptionId = tenantSubscription.TenantSubscriptionId,
            InvoiceNumber = $"INV-{nowUtc:yyyyMMdd}-{Guid.NewGuid():N}"[..24],
            AmountDue = plan.PriceMonthly,
            Currency = "PHP",
            Status = InvoiceStatus.Pending,
            IssuedAt = nowUtc,
            DueAt = nowUtc.AddDays(1),
            ProviderReference = providerReference,
        };

        _context.SubscriptionInvoices.Add(invoice);

        // Second Save: Now that we have IDs, we can link the Tenant back to its Subscription
        // and mark the verification session as used.
        tenant.CurrentSubscriptionId = tenantSubscription.TenantSubscriptionId;
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
            Status = invoice.Status.ToString(),
            IsTenantActive = tenant?.IsActive ?? false,
            TenantSubscriptionStatus = invoice.TenantSubscription?.Status.ToString(),
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
                PaymentMethod = PaymentMethod.Checkout,
                Provider = PaymentProvider.PayMongo,
                ProviderPaymentId = providerPaymentId,
                Status = PaymentStatus.Paid,
                PaidAt = paidAt,
            });

            invoice.Status = InvoiceStatus.Paid;
            invoice.PaidAt = paidAt;

            var tenantSubscription = invoice.TenantSubscription;
            if (tenantSubscription != null)
            {
                tenantSubscription.Status = SubscriptionStatus.Active;
                tenantSubscription.PeriodStart = paidAt;
                tenantSubscription.PeriodEnd = paidAt.AddMonths(1);
                tenantSubscription.UpdatedAt = DateTime.UtcNow;

                var tenant = tenantSubscription.Tenant;
                if (tenant != null)
                {
                    tenant.IsActive = true;
                    tenant.SubscriptionStatus = SubscriptionStatus.Active;
                    tenant.SubscriptionTier = Enum.TryParse<SubscriptionTier>(tenantSubscription.Plan?.Name, true, out var tier) ? tier : tenant.SubscriptionTier;
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
            invoice.Status = InvoiceStatus.Failed;
        }
        else
        {
            invoice.Status = InvoiceStatus.Pending;
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

    public async Task<CurrentSubscriptionResponse> GetCurrentSubscriptionAsync(
        int tenantId,
        CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.CurrentSubscription)
            .ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && !t.IsDeleted, cancellationToken);

        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found.");
        }

        var activeBranches = await _context.Branches
            .IgnoreQueryFilters()
            .CountAsync(
                b => b.TenantId == tenantId
                     && !b.IsDeleted
                     && b.IsActive,
                cancellationToken);

        var activeUsers = await _context.Users
            .IgnoreQueryFilters()
            .CountAsync(
                u => u.TenantId == tenantId
                     && !u.IsDeleted
                     && u.IsActive,
                cancellationToken);

        var subscription = tenant.CurrentSubscription;
        var latestInvoice = subscription == null
            ? null
            : await _context.SubscriptionInvoices
                .Where(i => i.TenantSubscriptionId == subscription.TenantSubscriptionId)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

        var latestPayment = latestInvoice == null
            ? null
            : await _context.SubscriptionPayments
                .Where(p => p.InvoiceId == latestInvoice.InvoiceId)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

        var planCode = subscription?.Plan?.PlanCode
            ?? tenant.SubscriptionTier.ToString().ToUpperInvariant();
        var planName = subscription?.Plan?.Name
            ?? tenant.SubscriptionTier.ToString();
        var branchLimit = subscription?.Plan?.BranchLimit;
        var userLimit = subscription?.Plan?.UserLimit;

        if (!branchLimit.HasValue || !userLimit.HasValue)
        {
            var fallbackPlan = await _context.SubscriptionPlans
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    p => p.IsActive
                         && !p.IsDeleted
                         && (p.PlanCode == planCode || p.Name == planName),
                    cancellationToken);

            branchLimit ??= fallbackPlan?.BranchLimit;
            userLimit ??= fallbackPlan?.UserLimit;
            if (fallbackPlan != null)
            {
                planCode = fallbackPlan.PlanCode;
                planName = fallbackPlan.Name;
            }
        }

        return new CurrentSubscriptionResponse
        {
            TenantId = tenant.TenantId,
            PlanCode = planCode,
            PlanName = planName,
            BranchLimit = branchLimit,
            UserLimit = userLimit,
            UsersPerBranchLimit = SubscriptionLimitService.DefaultUsersPerBranchLimit,
            ActiveBranches = activeBranches,
            ActiveUsers = activeUsers,
            Status = tenant.SubscriptionStatus.ToString(),
            BillingCycle = (subscription?.BillingCycle ?? BillingCycle.Monthly).ToString(),
            PeriodStart = tenant.SubscriptionPeriodStart ?? subscription?.PeriodStart,
            PeriodEnd = tenant.SubscriptionPeriodEnd ?? subscription?.PeriodEnd,
            NextBillingDate = tenant.SubscriptionPeriodEnd ?? subscription?.PeriodEnd,
            AutoRenew = subscription?.AutoRenew ?? false,
            CanceledAt = subscription?.CanceledAt,
            IsReadOnly = IsReadOnlyStatus(tenant.SubscriptionStatus),
            LatestInvoiceStatus = latestInvoice?.Status.ToString(),
            LatestInvoiceDueAt = latestInvoice?.DueAt,
            LatestInvoiceAmountDue = latestInvoice?.AmountDue,
            LatestPaymentStatus = latestPayment?.Status.ToString(),
            LatestPaidAt = latestPayment?.PaidAt,
            PaymentProvider = (latestPayment?.Provider ?? PaymentProvider.PayMongo).ToString()
        };
    }



    private async Task<CheckoutSessionResponse> GeneratePayMongoCheckoutAsync(
        SubscriptionPlan plan,
        string referenceNumber,
        string email,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting PayMongo checkout session creation for plan {PlanName}, amount {Amount}, email {Email}", 
            plan.Name, plan.PriceMonthly, email);

        var secretKey = _configuration["PayMongo:SecretKey"];
        
        // Validate API key
        if (string.IsNullOrWhiteSpace(secretKey) || secretKey == "YOUR_PAYMONGO_SECRET_KEY" || secretKey == "sk_test_placeholder")
        {
            _logger.LogError("PayMongo API key is missing or using placeholder value");
            throw new InvalidOperationException("PayMongo configuration is missing or using placeholder keys. Please update your settings with valid API keys.");
        }

        // Validate API key format
        if (!secretKey.StartsWith("sk_test_") && !secretKey.StartsWith("sk_live_"))
        {
            _logger.LogError("Invalid PayMongo API key format: {KeyPrefix}", secretKey.Substring(0, Math.Min(7, secretKey.Length)));
            throw new InvalidOperationException("Invalid PayMongo API key format. Key must start with 'sk_test_' or 'sk_live_'.");
        }

        _logger.LogInformation("PayMongo API key validated successfully (type: {KeyType})", 
            secretKey.StartsWith("sk_test_") ? "test" : "live");

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

        _logger.LogDebug("PayMongo request payload: Amount={Amount}, Currency=PHP, ReferenceNumber={RefNum}, SuccessUrl={SuccessUrl}", 
            (int)(plan.PriceMonthly * 100), referenceNumber, $"{frontendBaseUrl}/market/register/success");

        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        
        var authHeader = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes(secretKey + ":"));
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authHeader);
        
        _logger.LogDebug("Sending POST request to PayMongo API: https://api.paymongo.com/v1/checkout_sessions");

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsJsonAsync("https://api.paymongo.com/v1/checkout_sessions", payload, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP request to PayMongo failed: {Message}", ex.Message);
            throw new InvalidOperationException($"Failed to connect to PayMongo API. Please check your internet connection and try again. Technical details: {ex.Message}", ex);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "PayMongo API request timed out after 30 seconds");
            throw new InvalidOperationException("Payment gateway request timed out. Please try again.", ex);
        }

        _logger.LogInformation("PayMongo API response received: StatusCode={StatusCode}", response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("PayMongo API error: StatusCode={StatusCode}, ResponseBody={ResponseBody}", 
                response.StatusCode, errorBody);

            // Parse error for user-friendly message
            var userMessage = response.StatusCode switch
            {
                System.Net.HttpStatusCode.Unauthorized => "Payment gateway authentication failed. Please contact support.",
                System.Net.HttpStatusCode.NotFound => "Payment gateway endpoint not found. The API may have changed. Please contact support.",
                System.Net.HttpStatusCode.BadRequest => $"Invalid payment request. Please contact support with this error: {errorBody}",
                System.Net.HttpStatusCode.TooManyRequests => "Too many payment requests. Please wait a moment and try again.",
                _ => $"Payment gateway error ({response.StatusCode}). Please try again or contact support."
            };

            throw new InvalidOperationException($"{userMessage} Technical details: {errorBody}");
        }

        _logger.LogInformation("PayMongo checkout session created successfully");

        using var jsonDoc = await System.Text.Json.JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken), 
            default, 
            cancellationToken);
        
        var data = jsonDoc.RootElement.GetProperty("data");
        var attributes = data.GetProperty("attributes");
        var checkoutUrl = attributes.GetProperty("checkout_url").GetString()!;
        var sessionId = data.GetProperty("id").GetString()!;

        _logger.LogInformation("PayMongo checkout URL generated: SessionId={SessionId}", sessionId);

        return new CheckoutSessionResponse
        {
            SessionId = sessionId,
            CheckoutUrl = checkoutUrl
        };
    }

    public async Task CancelSubscriptionAsync(int tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.CurrentSubscription)
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && !t.IsDeleted, cancellationToken);

        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found.");
        }

        if (tenant.CurrentSubscription == null)
        {
            throw new InvalidOperationException("No tenant subscription found.");
        }

        var nowUtc = DateTime.UtcNow;
        tenant.SubscriptionStatus = SubscriptionStatus.Canceled;
        tenant.CurrentSubscription.Status = SubscriptionStatus.Canceled;
        tenant.CurrentSubscription.AutoRenew = false;
        tenant.CurrentSubscription.CanceledAt = nowUtc;
        tenant.CurrentSubscription.UpdatedAt = nowUtc;

        if (!tenant.SubscriptionPeriodStart.HasValue)
        {
            tenant.SubscriptionPeriodStart = tenant.CurrentSubscription.PeriodStart;
        }

        if (!tenant.SubscriptionPeriodEnd.HasValue)
        {
            tenant.SubscriptionPeriodEnd = tenant.CurrentSubscription.PeriodEnd <= nowUtc
                ? nowUtc
                : tenant.CurrentSubscription.PeriodEnd;
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

    private static string? NormalizeNullable(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static bool IsReadOnlyStatus(SubscriptionStatus status)
    {
        return status != SubscriptionStatus.Active
               && status != SubscriptionStatus.PendingPayment
               && status != SubscriptionStatus.Trialing;
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
