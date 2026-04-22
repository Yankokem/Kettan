using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Kettan.Server.Services.Email;

public class MailtrapEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailtrapEmailService> _logger;

    public MailtrapEmailService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MailtrapEmailService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public Task SendRegistrationOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
    {
        var subject = "Your Kettan verification code";
        var textBody = $"Your Kettan verification code is {otpCode}. It expires in {expiryMinutes} minutes.";
        return SendAsync(email, subject, textBody, "Registration OTP", cancellationToken);
    }

    public Task SendWelcomeEmailAsync(
        string email,
        string tenantName,
        string loginUrl,
        CancellationToken cancellationToken = default)
    {
        var subject = "Welcome to Kettan";
        var textBody = $"Welcome to Kettan, {tenantName}! You can login here: {loginUrl}";
        return SendAsync(email, subject, textBody, "Welcome", cancellationToken);
    }

    public Task SendLowStockAlertAsync(
        string email,
        IEnumerable<string> items,
        CancellationToken cancellationToken = default)
    {
        var subject = "Kettan: Low Stock Alert";
        var textBody = $"The following items are running low on stock:\n- {string.Join("\n- ", items)}";
        return SendAsync(email, subject, textBody, "Alert", cancellationToken);
    }

    public Task SendOrderStatusUpdateAsync(
        string email,
        int orderId,
        string status,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Order #{orderId} Update";
        var textBody = $"The status of your order #{orderId} has been updated to: {status}.";
        return SendAsync(email, subject, textBody, "Order", cancellationToken);
    }

    public Task SendPasswordResetAsync(
        string email,
        string resetToken,
        CancellationToken cancellationToken = default)
    {
        var subject = "Password Reset Request";
        var textBody = $"Your password reset token is: {resetToken}";
        return SendAsync(email, subject, textBody, "Auth", cancellationToken);
    }

    private async Task SendAsync(
        string email,
        string subject,
        string textBody,
        string category,
        CancellationToken cancellationToken)
    {
        var apiToken = _configuration["Mailtrap:ApiToken"];
        var sandboxId = _configuration["Mailtrap:SandboxId"];
        var host = _configuration["Mailtrap:Host"] ?? "https://sandbox.api.mailtrap.io";
        var fromEmail = _configuration["Mailtrap:FromEmail"] ?? "noreply@kettan.local";
        var fromName = _configuration["Mailtrap:FromName"] ?? "Kettan";

        if (string.IsNullOrWhiteSpace(apiToken) || string.IsNullOrWhiteSpace(sandboxId))
        {
            _logger.LogWarning("Mailtrap configuration is missing. Skipping email to {Email}.", email);
            return;
        }

        var url = $"{host.TrimEnd('/')}/api/send/{sandboxId}";
        var payload = new
        {
            from = new { email = fromEmail, name = fromName },
            to = new[] { new { email } },
            subject,
            text = textBody,
            category,
        };

        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"),
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Mailtrap email send failed. Status: {StatusCode}, Body: {Body}",
                (int)response.StatusCode,
                responseBody);
            throw new InvalidOperationException("Failed to send verification email.");
        }
    }
}
