using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Entities;
using Kettan.Server.Enums;
using Kettan.Server.Services.Email;
using Kettan.Server.Services.BranchOperations;

namespace Kettan.Server.Services.Subscription;

public class MonthlyBillingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MonthlyBillingBackgroundService> _logger;

    public MonthlyBillingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<MonthlyBillingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MonthlyBillingBackgroundService is starting.");

        // For testing purposes, run the check every 1 minute.
        // In a real production environment, this should be set to TimeSpan.FromHours(24)
        // or triggered via Hangfire/Cron job.
        var checkInterval = TimeSpan.FromMinutes(1);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRenewalsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing monthly renewals.");
            }

            await Task.Delay(checkInterval, stoppingToken);
        }
    }

    private async Task ProcessRenewalsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var nowUtc = DateTime.UtcNow;

        // Find all active subscriptions that are due for renewal (PeriodEnd is in the past or exactly now)
        var dueSubscriptions = await context.TenantSubscriptions
            .Include(ts => ts.Tenant)
            .Include(ts => ts.Plan)
            .Where(ts => ts.Status == SubscriptionStatus.Active 
                         && ts.AutoRenew 
                         && ts.PeriodEnd <= nowUtc)
            .ToListAsync(cancellationToken);

        if (!dueSubscriptions.Any())
        {
            return;
        }

        _logger.LogInformation($"Found {dueSubscriptions.Count} subscriptions due for renewal.");

        foreach (var subscription in dueSubscriptions)
        {
            if (subscription.Tenant == null || subscription.Plan == null) continue;

            try
            {
                // 1. Generate Invoice
                var invoice = new SubscriptionInvoice
                {
                    TenantSubscriptionId = subscription.TenantSubscriptionId,
                    InvoiceNumber = $"INV-{nowUtc:yyyyMMdd}-{Guid.NewGuid():N}"[..24],
                    AmountDue = subscription.Plan.PriceMonthly,
                    Currency = "PHP",
                    Status = InvoiceStatus.Paid, // Simulating an immediate auto-charge success
                    IssuedAt = nowUtc,
                    DueAt = nowUtc,
                    PaidAt = nowUtc,
                    ProviderReference = $"auto_chk_{Guid.NewGuid():N}"
                };

                context.SubscriptionInvoices.Add(invoice);

                // 2. Generate Payment Record (Simulated Auto-charge)
                var payment = new SubscriptionPayment
                {
                    Invoice = invoice,
                    Amount = invoice.AmountDue,
                    Currency = invoice.Currency,
                    PaymentMethod = PaymentMethod.Checkout,
                    Provider = PaymentProvider.PayMongo,
                    ProviderPaymentId = $"pay_auto_{Guid.NewGuid():N}",
                    Status = PaymentStatus.Paid,
                    PaidAt = nowUtc,
                };

                context.SubscriptionPayments.Add(payment);

                // 3. Extend Subscription
                subscription.PeriodStart = nowUtc;
                subscription.PeriodEnd = nowUtc.AddMonths(1);
                subscription.UpdatedAt = nowUtc;

                subscription.Tenant.SubscriptionPeriodStart = subscription.PeriodStart;
                subscription.Tenant.SubscriptionPeriodEnd = subscription.PeriodEnd;

                await context.SaveChangesAsync(cancellationToken);

                // 4. Send Notifications
                var admins = await context.Users
                    .Where(u => u.TenantId == subscription.TenantId && u.Role == UserRole.TenantAdmin)
                    .ToListAsync(cancellationToken);

                var adminIds = admins.Select(a => a.UserId).ToList();

                if (adminIds.Any())
                {
                    await notificationService.CreateForUsersAsync(
                        adminIds,
                        "Subscription Renewed",
                        $"Your monthly subscription for {subscription.Plan.Name} was automatically renewed for ₱{invoice.AmountDue:N2}.",
                        "System");
                }

                if (!string.IsNullOrWhiteSpace(subscription.Tenant.Email))
                {
                    await emailService.SendInvoicePaidEmailAsync(
                        subscription.Tenant.Email,
                        subscription.Tenant.Name,
                        invoice.AmountDue,
                        invoice.InvoiceNumber,
                        cancellationToken);
                }

                _logger.LogInformation($"Successfully renewed subscription for Tenant {subscription.Tenant.Name}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to renew subscription for TenantId {subscription.TenantId}");
            }
        }
    }
}
