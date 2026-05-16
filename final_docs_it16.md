# 1. Project Overview

**Purpose:** Kettan is a multi-tenant SaaS platform for coffee chain management. It handles inventory tracking, supply chain operations, order processing, branch management, menu management, and analytics across multiple branches under a single tenant organization.

**Intended Users:**
- Super Admin (platform-level operator)
- Tenant Admin (coffee chain business owner)
- HQ Manager / HQ Staff (headquarters operations)
- Branch Owner / Branch Manager (branch-level management)
- Store Staff (frontline operations)

**Platform/Languages:**
- Backend: ASP.NET Core (.NET 10) with C#, Entity Framework Core, SQL Server
- Frontend: React (TypeScript) with Vite, TanStack Router, Zustand state management
- Real-time: SignalR WebSockets
- Email: Gmail SMTP
- Cloud Storage: Cloudinary
- Payments: PayMongo

---

# 2. Secure Coding Practices

**How hardcoded credentials are avoided:**
Sensitive values (DB connection strings, JWT secrets, SMTP passwords, API keys) are stored in `appsettings.json` / `appsettings.Development.json` and loaded via `IConfiguration` at runtime. Production secrets use .NET User Secrets (`UserSecretsId` in `.csproj`). Values like PayMongo keys and Cloudinary URL are set to `"REPLACED_BY_SECRET_MANAGER"` in the committed config file.

**Sample secure code:**

```csharp
// Program.cs — secrets loaded from config, never hardcoded
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

// SmtpEmailService.cs — SMTP credentials from config
var username = _configuration["Smtp:Username"];
var password = _configuration["Smtp:Password"];
```

**Screenshot:** Take screenshot of:
- `Kettan.Server/appsettings.json` lines 22-28 (shows `REPLACED_BY_SECRET_MANAGER` placeholders)
- `Kettan.Server/Kettan.Server.csproj` line 10 (shows `UserSecretsId`)
- `Kettan.Server/Program.cs` lines 23-24 (shows config-based secret loading)

---

# 3. Authentication and Authorization

**Login Process:**
1. User submits email + password to `POST /api/auth/login`.
2. Server validates credentials using BCrypt hash comparison.
3. If logging in from an unrecognized device, a 6-digit OTP is sent via email (MFA). User must verify OTP via `POST /api/auth/verify-mfa`.
4. Upon success, a JWT token is issued in an HttpOnly cookie (`jwt`), and a device recognition cookie (`kettan_device_id`) is set for 30 days.
5. 30-minute inactivity timeout auto-logs out the user on the frontend.

**Registration:**
1. User submits email on the registration page.
2. A 6-digit OTP is sent to verify email ownership.
3. After OTP verification, the user completes onboarding (company name, details).
4. Account is created with a BCrypt-hashed password.

**Password Hashing:**
BCrypt via the `BCrypt.Net-Next` NuGet package. Passwords are hashed on creation and verified on login.

```csharp
// Hashing (during user creation)
user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

// Verification (during login) — AuthService.cs line 43
if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    return null;
```

**User Roles and Access Restrictions:**
7 roles defined in `Enums/UserRole.cs`: SuperAdmin, TenantAdmin, HqManager, HqStaff, BranchOwner, BranchManager, StoreStaff.

Access is enforced at two levels:
- **Backend:** `[Authorize(Roles = "TenantAdmin,HqManager")]` attributes on controller endpoints.
- **Frontend:** `canAccessModule()` function in `roleHelpers.ts` controls sidebar visibility and route guards in `router.tsx`.

**Screenshot:** Take screenshot of:
- `Kettan.Server/Services/Auth/AuthService.cs` lines 43-46 (BCrypt verify)
- `Kettan.Server/Enums/UserRole.cs` full file
- `Kettan.Server/Controllers/UsersController.cs` lines 120-121 (shows `[Authorize(Roles = "TenantAdmin,HqManager")]`)
- `kettan.client/src/utils/roleHelpers.ts` lines 67-86 (permission matrix)

---

# 4. Data Encryption

**What data is encrypted:**
- **Passwords** — hashed using BCrypt (one-way hash, not reversible).
- **OTP codes** — hashed using BCrypt before storage in the database.
- **Payment API credentials** — PayMongo SecretKey, PublicKey, and WebhookSecret are stored as `"REPLACED_BY_SECRET_MANAGER"` placeholders in `appsettings.json` and loaded at runtime via .NET User Secrets / environment variables. They are never committed to source code. The service validates key format at runtime (`sk_test_` or `sk_live_` prefix check) and rejects placeholder values.
- **Data in transit** — HTTPS (TLS) enforced via `Secure = true` on all cookies. JWT is served as an HttpOnly, Secure, SameSite=Strict cookie. PayMongo API calls use HTTPS with Basic Auth (Base64-encoded secret key in the Authorization header).

**Encryption method/library:**
- `BCrypt.Net-Next` v4.1.0 for password and OTP hashing.
- ASP.NET Core's built-in HTTPS/TLS for transport encryption.
- JWT signed with HMAC-SHA256 (`SecurityAlgorithms.HmacSha256`).
- .NET User Secrets Manager for protecting API keys (PayMongo, Cloudinary) outside of source control.

**Screenshot:** Take screenshot of:
- Database `Users` table showing the `PasswordHash` column (will show `$2a$11$...` BCrypt hashes, not plaintext)
- `Kettan.Server/Services/Auth/AuthService.cs` lines 88-89 (OTP hash storage)
- `Kettan.Server/Controllers/AuthController.cs` lines 113-120 (HttpOnly Secure cookie)
- `Kettan.Server/appsettings.json` lines 22-28 (PayMongo/Cloudinary placeholder keys)

---

# 5. Input Validation and Sanitization

**What inputs are validated:**
- Email: `[Required]`, `[EmailAddress]`, `[StringLength(256)]` on DTOs.
- Password: `[Required]`, `[StringLength(64, MinimumLength = 6)]` on DTOs.
- OTP Code: `[Required]`, `[StringLength(6, MinimumLength = 6)]` on DTOs.
- All entity fields: `[Required]`, `[MaxLength]` annotations on entity models.
- Frontend: client-side regex email validation, min-length password checks before form submission.

**Tools/libraries used:**
- **Backend:** ASP.NET Core `System.ComponentModel.DataAnnotations` — model validation is automatic via `[ApiController]` attribute on controllers, which returns 400 Bad Request for invalid models.
- **Frontend:** Manual validation in React form handlers (e.g., `LoginPage.tsx` `validate()` function).
- Entity Framework parameterized queries (built-in SQL injection prevention).

**Screenshot:** Take screenshot of:
- `Kettan.Server/DTOs/Auth/LoginRequest.cs` full file (shows validation attributes)
- `Kettan.Server/DTOs/Auth/ResetPasswordRequest.cs` full file
- `kettan.client/src/features/auth/LoginPage.tsx` lines 59-55 (client-side validate function)
- Browser screenshot showing a rejected invalid input (try submitting login form with empty fields)

---

# 6. Error Handling and Logging

**How errors are handled:**
- Backend: try-catch blocks in controllers return structured JSON error responses (`{ message: "..." }`) with appropriate HTTP status codes (401, 403, 400, 500).
- Frontend: Axios interceptor catches 401 (auto-logout), 402 (subscription block), and displays error messages from the server response.
- Global: `UseDeveloperExceptionPage()` in development; production returns generic error responses.

**What logs are recorded:**
- **AuditLog entity** records: login success/failure, MFA challenges, logouts, all CRUD operations on entities, HTTP request metadata (method, route, status code, latency, IP, user agent).
- **Two audit systems:**
  1. `AuditLogInterceptor` — EF Core SaveChanges interceptor that auto-logs every entity Create/Update/Delete with old/new values.
  2. `AuditRequestMiddleware` — HTTP middleware that logs every non-GET API request with response status, latency, and correlation ID.
- Sensitive fields (`PasswordHash`, `OtpCode`) are excluded from audit logging.

**Screenshot:** Take screenshot of:
- Database `AuditLogs` table showing sample rows
- `Kettan.Server/Entities/AuditLog.cs` full file (shows all tracked fields)
- `Kettan.Server/Middleware/AuditLogInterceptor.cs` lines 30-35 (shows excluded sensitive properties)
- `Kettan.Server/Middleware/AuditRequestMiddleware.cs` lines 69-88 (shows request logging)

---

# 7. Access Control

**Protected pages:**
All pages except `/login`, `/forgot-password`, and `/market/*` (public marketing pages) are behind authentication. The `layoutRoute` in `router.tsx` has a `beforeLoad` guard that redirects unauthenticated users to `/login`.

Specific pages have additional role checks:
- `/orders` — HQ roles only (TenantAdmin, HqManager, HqStaff)
- `/company-profile` — TenantAdmin only
- `/audit-logs` — SuperAdmin, TenantAdmin, HqManager, BranchOwner, BranchManager
- `/menu-management` — TenantAdmin, HqManager, HqStaff
- `/staff directory` — SuperAdmin, TenantAdmin, HqManager
- `/tenants`, `/platform-users` — SuperAdmin only

**How unauthorized access is prevented:**
- **Backend:** `[Authorize]` attribute on all controllers. Role-specific `[Authorize(Roles = "...")]` on endpoints. JWT is validated on every request (issuer, audience, lifetime, signing key).
- **Frontend:** TanStack Router `beforeLoad` guards check `useAuthStore` auth state and role. Sidebar only renders links the user's role can access.
- **Multi-tenant isolation:** EF Core global query filters ensure users can only see data belonging to their own tenant (`TenantId == CurrentTenantId`).

**Screenshot:** Take screenshot of:
- `kettan.client/src/app/router.tsx` lines 61-70 (layout auth guard)
- `kettan.client/src/app/router.tsx` lines 252-265 (orders route with role check)
- `Kettan.Server/Data/ApplicationDbContext.cs` lines 182-218 (tenant query filters)
- Browser showing redirect to login when accessing a protected page while logged out

---

# 8. Code Auditing Tools

**Tools used:**
- **ESLint** — JavaScript/TypeScript linting for the React frontend (configured in the Vite project).
- **TypeScript compiler (`tsc`)** — strict mode enabled (`strict: true`), catches type errors, unused variables, null safety issues at compile time.
- **.NET Roslyn Analyzers** — built-in C# code analysis with `<Nullable>enable</Nullable>` in `.csproj` enforcing null safety across the backend.

**Vulnerabilities detected:**
- `npm audit` flags known dependency vulnerabilities (axios SSRF, follow-redirects header leak, PostCSS XSS, Vite path traversal) — these are upstream library issues in dev dependencies, not in our application code.

**Screenshot:** Take screenshot of:
- Run `npm audit` in `kettan.client/` terminal and screenshot the output
- Run `npm run build` showing TypeScript compilation output
- `Kettan.Server/Kettan.Server.csproj` lines 4-6 (shows Nullable enable, ImplicitUsings)

---

# 9. Testing

**Tests conducted:**
- **Build verification tests:** Full TypeScript compilation (`tsc -b`) and .NET build (`dotnet build`) run on every change.
- **Manual API testing:** Login, MFA verification, forgot password, reset password flows tested via the frontend UI and browser dev tools.
- **Integration testing:** End-to-end testing of auth flow (login → MFA OTP → dashboard access), supply chain workflows, order processing.

**Tools used:**
- Browser DevTools (Network tab for API call inspection)
- Postman (ad-hoc API endpoint testing)
- `dotnet build` / `npm run build` (compilation verification)

**Screenshot:** Take screenshot of:
- Successful `dotnet build` terminal output
- Successful `npm run build` terminal output
- Browser DevTools Network tab showing a successful login API call

---

# 10. Security Policies

**Password Policy:**
- Minimum 8 characters enforced on both frontend (validation function) and backend (`[StringLength(64, MinimumLength = 6)]` on DTO, frontend enforces 8).
- Passwords are BCrypt-hashed before storage. Never stored in plaintext.

**Login Attempt Policy:**
- Rate limited to 5 login attempts per minute per IP address via ASP.NET Core Rate Limiting middleware (`LoginRateLimit` policy in `Program.cs` lines 87-95).
- After exceeding the limit, HTTP 429 Too Many Requests is returned.
- All failed login attempts are logged to the `AuditLogs` table with `AUTH_LOGIN_FAIL` action code.

**Data Handling Policy:**
- Passwords and OTP codes are hashed (BCrypt) before database storage.
- JWT tokens are transmitted via HttpOnly, Secure, SameSite=Strict cookies — inaccessible to JavaScript (XSS protection).
- Multi-tenant data isolation via EF Core query filters prevents cross-tenant data access.
- 30-minute inactivity session timeout auto-clears user session.

---

# 11. Incident Response Plan

**Detection:**
- All system activities are recorded in the `AuditLogs` table (login attempts, data changes, API requests).
- MFA verification failures are logged with `AUTH_MFA_FAIL` action code.
- The AuditRequestMiddleware logs every non-GET API request with IP address, user agent, and correlation ID.

**Reporting:**
- Administrators can view audit logs via the `/audit-logs` page in the dashboard.
- Correlation IDs link related log entries for tracing a single user session.

**Containment:**
- Rate limiting blocks excessive login attempts at the IP level (5 per minute).
- MFA blocks unauthorized access from unrecognized devices.
- Account status can be set to Inactive/Archived by Tenant Admin to immediately block access.
- Subscription middleware can put a tenant into read-only mode, disabling all write operations.

**Recovery:**
- Password can be reset via the self-service forgot password flow (email OTP → new password).
- Tenant Admin can reset staff passwords and manage account statuses.

---

# 12. Security Compliance Handbook

**PASSWORD POLICY**
- Users must create a password with a minimum of 8 characters.
- Passwords are hashed using BCrypt before storage in the database.
- Plaintext passwords are never stored or logged by the system.
- Password reset requires email OTP verification.

**LOGIN ATTEMPT POLICY**
- Users are rate limited to five (5) login attempts per minute per IP address.
- After exceeding the limit, the system returns HTTP 429 and blocks further attempts for the remainder of the 1-minute window.
- All failed login attempts are logged in the AuditLogs table with the user's IP address, user agent, and timestamp.
- Multi-Factor Authentication (OTP via email) is required when logging in from an unrecognized device.

**DATA HANDLING POLICY**
- Personal information (passwords, OTP codes) is hashed before storage using BCrypt.
- Data is encrypted during transmission via HTTPS/TLS.
- JWT tokens are stored in HttpOnly, Secure, SameSite=Strict cookies to prevent XSS and CSRF attacks.
- Only authorized users within the same tenant can access tenant-specific records (enforced by EF Core query filters).

**ACCESS CONTROL POLICY**
- Only TenantAdmin users can access system configuration pages (Settings, Company Profile).
- Branch-level users are restricted to branch-specific features (Consumption, Supply Requests, Branch Profile).
- All API endpoints require JWT authentication. Role-specific endpoints enforce `[Authorize(Roles)]` checks.
- Frontend route guards redirect unauthorized users before page rendering.

**LOGGING AND MONITORING POLICY**
- All entity changes (Create, Update, Delete) are automatically recorded by the AuditLogInterceptor.
- All non-GET API requests are logged by the AuditRequestMiddleware with status code, latency, and correlation ID.
- Sensitive fields (PasswordHash, OtpCode) are excluded from audit log value tracking.
- Administrators can review audit logs via the Audit Logs page in the dashboard.

**BACKUP AND RECOVERY POLICY**
- The database is hosted on SQL Server with support for scheduled backups.
- Database schema is managed via EF Core Migrations, allowing version-controlled schema recovery.
- System state can be restored by applying migrations to a fresh database and re-seeding initial data.

**COMPLIANCE DECLARATION**
By submitting this project, the student confirms that all listed security policies have been properly implemented in the system.
