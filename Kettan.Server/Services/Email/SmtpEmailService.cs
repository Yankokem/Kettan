using System.Net;
using System.Net.Mail;

namespace Kettan.Server.Services.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendRegistrationOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
    {
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Your Kettan Registration Code</h2>
                <p>Please use the following OTP code to verify your Kettan account:</p>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;'>
                    <span style='font-size: 24px; font-weight: bold; letter-spacing: 5px;'>{otpCode}</span>
                </div>
                <p>This code will expire in {expiryMinutes} minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Regards,<br>The Kettan Team</p>
            </div>";

        await SendEmailAsync(email, "Your Kettan Registration Code", htmlContent, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(
        string email,
        string tenantName,
        string loginUrl,
        CancellationToken cancellationToken = default)
    {
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Welcome to Kettan!</h2>
                <p>Hi {tenantName},</p>
                <p>Your Kettan workspace is ready. You can log in using the link below:</p>
                <p><a href='{loginUrl}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Log In to Kettan</a></p>
                <p>We're excited to have you on board!</p>
                <p>Regards,<br>The Kettan Team</p>
            </div>";

        await SendEmailAsync(email, $"Welcome to Kettan, {tenantName}!", htmlContent, cancellationToken);
    }

    public async Task SendLowStockAlertAsync(
        string email,
        IEnumerable<string> items,
        CancellationToken cancellationToken = default)
    {
        var itemsList = string.Join("\n", items.Select(i => $"<li>{i}</li>"));
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Low Stock Alert</h2>
                <p>The following items are running low on stock:</p>
                <ul>
                    {itemsList}
                </ul>
                <p>Please review your inventory and request or order supplies as needed.</p>
                <p>Regards,<br>The Kettan System</p>
            </div>";

        await SendEmailAsync(email, "Low Stock Alert", htmlContent, cancellationToken);
    }

    public async Task SendOrderStatusUpdateAsync(
        string email,
        int orderId,
        string status,
        CancellationToken cancellationToken = default)
    {
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Order Status Update</h2>
                <p>Your order #{orderId} has been updated to: <strong>{status}</strong></p>
                <p>Thank you for using Kettan.</p>
                <p>Regards,<br>The Kettan System</p>
            </div>";

        await SendEmailAsync(email, $"Order #{orderId} Status Update", htmlContent, cancellationToken);
    }

    public async Task SendPasswordResetAsync(
        string email,
        string resetToken,
        CancellationToken cancellationToken = default)
    {
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Use the token below to reset it:</p>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;'>
                    <span style='font-size: 18px; font-weight: bold;'>{resetToken}</span>
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <p>Regards,<br>The Kettan Team</p>
            </div>";

        await SendEmailAsync(email, "Kettan Password Reset", htmlContent, cancellationToken);
    }

    public async Task SendInvoicePaidEmailAsync(
        string email,
        string tenantName,
        decimal amount,
        string invoiceNumber,
        CancellationToken cancellationToken = default)
    {
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Subscription Renewed Successfully</h2>
                <p>Hi {tenantName},</p>
                <p>Your Kettan monthly subscription has been automatically renewed.</p>
                <div style='background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <p style='margin: 5px 0;'><strong>Invoice Number:</strong> {invoiceNumber}</p>
                    <p style='margin: 5px 0;'><strong>Amount Paid:</strong> ₱{amount:N2}</p>
                    <p style='margin: 5px 0;'><strong>Date:</strong> {DateTime.UtcNow:MMMM dd, yyyy}</p>
                </div>
                <p>Thank you for continuing to use Kettan.</p>
                <p>Regards,<br>The Kettan Team</p>
            </div>";

        await SendEmailAsync(email, "Kettan Subscription Receipt", htmlContent, cancellationToken);
    }

    public async Task SendMfaOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
    {
        var htmlContent = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
                <h2>Login Verification Code</h2>
                <p>A sign-in attempt was detected from an unrecognized device. Please use the code below to verify your identity:</p>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;'>
                    <span style='font-size: 28px; font-weight: bold; letter-spacing: 8px;'>{otpCode}</span>
                </div>
                <p>This code will expire in {expiryMinutes} minutes.</p>
                <p>If you did not attempt to sign in, please change your password immediately.</p>
                <p>Regards,<br>The Kettan Team</p>
            </div>";

        await SendEmailAsync(email, "Kettan Login Verification Code", htmlContent, cancellationToken);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlContent, CancellationToken cancellationToken)
    {
        try
        {
            var host = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
            var port = _configuration.GetValue<int>("Smtp:Port", 587);
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromName = _configuration["Smtp:FromName"] ?? "Kettan System";

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                throw new InvalidOperationException("SMTP credentials are not configured.");
            }

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(username, fromName),
                Subject = subject,
                Body = htmlContent,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            // Register cancellation to abort the send if needed
            using (cancellationToken.Register(() => client.SendAsyncCancel()))
            {
                await client.SendMailAsync(mailMessage, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while sending email via SMTP to {Email}", toEmail);
            throw new InvalidOperationException($"Failed to send email via SMTP: {ex.Message}", ex);
        }
    }
}