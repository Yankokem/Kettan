using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Text;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Auth;
using Kettan.Server.Services.BranchOperations;
using Kettan.Server.Services.Inventory;
using Kettan.Server.Services.Email;
using Kettan.Server.Services.Subscription;
using Kettan.Server.Services.Analytics;
using Kettan.Server.Services.Export;
using Kettan.Server.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Setup JWT Auth
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("jwt"))
            {
                context.Token = context.Request.Cookies["jwt"];
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ISupplyRequestService, SupplyRequestService>();
builder.Services.AddScoped<IConsumptionService, ConsumptionService>();
builder.Services.AddScoped<IOrderWorkflowService, OrderWorkflowService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddHttpClient<IEmailService, MailtrapEmailService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ICsvExportService, CsvExportService>();
builder.Services.AddScoped<IPdfExportService, PdfExportService>();
builder.Services.AddScoped<IImageService, CloudinaryService>();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("LoginRateLimit", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy("OtpRequestRateLimit", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0
            }));
});

builder.Services.AddSingleton<Kettan.Server.Middleware.AuditLogInterceptor>();

builder.Services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(serviceProvider.GetRequiredService<Kettan.Server.Middleware.AuditLogInterceptor>()));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://kettan-om.runasp.net",
            "https://kettan-om.runasp.net",
            "http://localhost:5173",
            "https://localhost:61643"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Enable detailed errors in Prod so we can actually see the C# crash message
app.UseDeveloperExceptionPage();

app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 1. MUST USE CORS FIRST
app.UseCors("AllowFrontend");

// 2. Then handle the manual OPTIONS if needed, but CORS middleware usually handles it
app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        await context.Response.CompleteAsync();
        return;
    }
    await next();
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SubscriptionCheckMiddleware>();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();
        await DbInitializer.InitializeAsync(context, logger);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
        System.IO.File.WriteAllText(Path.Combine(builder.Environment.ContentRootPath, "seed_error.txt"), ex.ToString());
    }
}

app.MapGet("/api/debug/seed-error", (IWebHostEnvironment env) => 
{
    var path = Path.Combine(env.ContentRootPath, "seed_error.txt");
    return File.Exists(path) ? Results.Text(File.ReadAllText(path)) : Results.Ok("No error");
});

app.MapGet("/api/debug/auth-diag", async (string email, ApplicationDbContext db, IConfiguration config) =>
{
    var connString = config.GetConnectionString("DefaultConnection");
    var maskedConn = connString?.Contains("Password=") == true 
        ? System.Text.RegularExpressions.Regex.Replace(connString, @"Password=[^;]+", "Password=***")
        : connString ?? "NULL_OR_EMPTY";

    bool canConnect = false;
    try { canConnect = await db.Database.CanConnectAsync(); } catch { }

    var user = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == email);
    
    bool passwordMatches = false;
    if (user != null && !string.IsNullOrEmpty(user.PasswordHash))
    {
        try { passwordMatches = BCrypt.Net.BCrypt.Verify("password123", user.PasswordHash); } catch { }
    }

    var jwtKey = config.GetSection("JwtSettings")["SecretKey"];

    return Results.Ok(new {
        Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
        ConnectionStringMasked = maskedConn,
        CanConnectToDb = canConnect,
        UserFound = user != null,
        IsActive = user?.IsActive,
        IsDeleted = user?.IsDeleted,
        HasPasswordHash = !string.IsNullOrEmpty(user?.PasswordHash),
        PasswordMatches = passwordMatches,
        JwtSecretConfigured = !string.IsNullOrEmpty(jwtKey)
    });
});

app.Run();