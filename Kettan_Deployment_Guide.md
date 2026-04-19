# Kettan — Deployment Guide (MonsterASP + SSMS)

> Step-by-step instructions for deploying Kettan to MonsterASP hosting with SQL Server.
> Last updated: 2026-04-19

---

## Overview

| Component | Technology | Hosting |
|---|---|---|
| **Backend** | ASP.NET Core (.NET 10) | MonsterASP (Windows shared hosting) |
| **Frontend** | React + Vite (built into `wwwroot` via SPA proxy) | Bundled with backend (deployed together) |
| **Database** | SQL Server (MSSQL) | MonsterASP MSSQL (already provisioned: `db47422.databaseasp.net`) |
| **DB Management** | SQL Server Management Studio (SSMS) | Your local machine |

---

## Prerequisites

- [x] Visual Studio 2022+ with ASP.NET workload installed
- [x] SQL Server Management Studio (SSMS) installed locally
- [ ] MonsterASP account with active hosting plan
- [ ] Node.js 18+ for frontend build

---

## Step 1: Database Setup via SSMS

### 1A. Connect to Remote Database

1. Open **SSMS**
2. Connect with these credentials (from your `appsettings.json`):

   | Field | Value |
   |---|---|
   | Server name | `db47422.databaseasp.net` |
   | Authentication | SQL Server Authentication |
   | Login | `db47422` |
   | Password | *(from your appsettings.json — already configured)* |

3. Click **Connect**

> [!NOTE]
> If connection fails, log into the MonsterASP control panel and check that **Remote Access** is enabled for your IP address under the MSSQL database settings.

### 1B. Run the Schema

**Option A — Run schema.sql directly (Recommended for fresh setup)**

1. In SSMS, right-click your database `db47422` → **New Query**
2. Open `mics/schema.sql` from your project
3. Copy the entire contents into the query window
4. Click **Execute** (F5)
5. Verify all tables were created in the Object Explorer (refresh if needed)

**Option B — Use EF Core Migrations (Recommended after entity alignment)**

```powershell
# From Kettan.Server/ directory
dotnet ef database update --connection "Server=db47422.databaseasp.net;Database=db47422;User Id=db47422;Password=YOUR_PASSWORD;Encrypt=False;MultipleActiveResultSets=True;"
```

> [!WARNING]
> Don't mix both approaches. If you ran schema.sql manually, don't also run EF migrations — they'll conflict. Pick one strategy and stick with it. For production, schema.sql is simpler and more predictable.

### 1C. Verify Tables

In SSMS Object Explorer, expand:
```
db47422 → Tables
```

You should see all tables: `Tenants`, `Branches`, `Users`, `Items`, `Batches`, `Orders`, `SupplyRequests`, etc.

### 1D. Seed Initial Data

Option 1: Let the app's `DbInitializer` seed on first run (automatic).

Option 2: Run seed SQL manually in SSMS:
```sql
-- Check if already seeded
SELECT COUNT(*) FROM Tenants;

-- If 0, the application will auto-seed on first launch via DbInitializer.cs
```

---

## Step 2: Configure Production Settings

### 2A. Update appsettings.json for Production

Your `appsettings.json` already has the production connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=db47422.databaseasp.net; Database=db47422; User Id=db47422; Password=YOUR_PASSWORD; Encrypt=False; MultipleActiveResultSets=True;"
  }
}
```

> [!CAUTION]
> **Security**: Your JWT `SecretKey` is currently a readable string. For production, use a strong random key (64+ characters). Never commit real secrets to Git. Consider using environment variables or Azure Key Vault.

### 2B. Create appsettings.Production.json (optional but recommended)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=db47422.databaseasp.net; Database=db47422; User Id=db47422; Password=YOUR_PRODUCTION_PASSWORD; Encrypt=True; TrustServerCertificate=True; MultipleActiveResultSets=True;"
  },
  "JwtSettings": {
    "SecretKey": "USE_A_STRONG_RANDOM_SECRET_KEY_HERE_64CHARS_MINIMUM_ABCDEFGHIJK",
    "Issuer": "Kettan.Server",
    "Audience": "Kettan.Client",
    "ExpiryInMinutes": 1440
  }
}
```

### 2C. Fix CORS (if frontend and API are on different domains)

If your frontend is on a different domain than the API, add CORS in `Program.cs`:

```csharp
// Add before app.Build()
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://your-domain.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add after app.UseHttpsRedirection()
app.UseCors();
```

> [!NOTE]
> Since Kettan serves the SPA from the same origin (`MapFallbackToFile("/index.html")`), you likely don't need CORS at all. The frontend is bundled into the backend's `wwwroot` on publish.

---

## Step 3: Build the Application

### 3A. Build Frontend

```powershell
cd kettan.client
npm install
npm run build
```

This outputs the production bundle to `kettan.client/dist/`.

### 3B. Build Backend (includes frontend via SpaProxy)

```powershell
cd Kettan.Server
dotnet publish -c Release -o ./publish
```

The publish folder will contain:
- The compiled ASP.NET backend
- The frontend SPA files (copied from `kettan.client/dist` into `wwwroot`)
- `web.config` (auto-generated for IIS hosting)

---

## Step 4: Deploy to MonsterASP

### 4A. Get Publish Profile

1. Log into [MonsterASP Control Panel](https://panel.monsterasp.net)
2. Go to your **Website** settings
3. Enable **Web Deploy** (if not already enabled)
4. Download the **Publish Profile** (`.publishsettings` file)

### 4B. Deploy from Visual Studio

1. Open the solution in **Visual Studio**
2. Right-click `Kettan.Server` → **Publish**
3. Click **Import Profile** → select the `.publishsettings` file you downloaded
4. Click **Show all settings**:
   - Verify **Target Runtime**: `win-x64` (or whatever MonsterASP supports)
   - Verify **Connection string** points to the production DB
   - Ensure **Remove additional files at destination** is checked (clean deploy)
5. Click **Publish**
6. Wait for deployment to complete (Visual Studio will show progress)

### 4C. Alternative: Manual FTP Upload

If Web Deploy doesn't work:

1. Build the publish output: `dotnet publish -c Release -o ./publish`
2. In MonsterASP control panel, get FTP credentials
3. Upload the entire `publish/` folder contents to the website root via FileZilla or similar
4. Ensure `web.config` is at the root level

---

## Step 5: Post-Deployment Verification

### 5A. Check the Site

1. Navigate to `https://your-monsterasp-url.com`
2. You should see the Kettan login page
3. Try logging in with seeded credentials:

| Role | Email | Password |
|---|---|---|
| SuperAdmin | `superadmin@kettan.local` | `password123` |
| TenantAdmin | `tenantadmin@dummycorp.local` | `password123` |
| HqManager | `hqmanager@dummycorp.local` | `password123` |
| BranchManager | `manager_main@dummycorp.local` | `password123` |
| BranchOwner | `owner_main@dummycorp.local` | `password123` |

### 5B. Test Critical Endpoints

Open browser DevTools → Network tab and verify API calls:

| Test | Expected |
|---|---|
| Login | `POST /api/auth/login` returns 200 + JWT cookie |
| Dashboard | `GET /api/*` calls succeed (not 500) |
| Supply Requests | `GET /api/supplyRequests` returns data |

### 5C. Troubleshoot Common Issues

| Issue | Fix |
|---|---|
| **500 Internal Server Error** | Check MonsterASP error logs in control panel. Usually a connection string or missing DLL issue. |
| **404 on all API routes** | `web.config` may be missing or misconfigured. Ensure the ASP.NET Core module is properly configured. |
| **Database connection failed** | Verify connection string, check that remote access is enabled in MonsterASP panel, check firewall. |
| **JWT auth not working** | Ensure `JwtSettings:SecretKey` in production matches what's deployed. Cookie `SameSite` may need adjusting for cross-domain. |
| **Frontend loads but API fails** | Check browser console for CORS errors. Since SPA is bundled, this shouldn't happen unless API URL is misconfigured. |
| **Static files not found** | Ensure `app.UseDefaultFiles()` and `app.MapStaticAssets()` are in `Program.cs` (they are). |

---

## Step 6: SSMS Ongoing Operations

### Useful Queries for Monitoring

```sql
-- Check tenant count
SELECT COUNT(*) AS TenantCount FROM Tenants WHERE IsActive = 1;

-- Check user activity
SELECT Role, COUNT(*) AS UserCount FROM Users GROUP BY Role;

-- Check recent orders
SELECT TOP 20 o.OrderId, o.Status, sr.BranchId, o.PushedToFulfillmentAt
FROM Orders o
JOIN SupplyRequests sr ON o.RequestId = sr.RequestId
ORDER BY o.PushedToFulfillmentAt DESC;

-- Check stock levels (HQ)
SELECT i.Name, SUM(b.CurrentQuantity) AS TotalStock
FROM Batches b
JOIN Items i ON b.ItemId = i.ItemId
WHERE b.BranchId IS NULL  -- HQ only
GROUP BY i.Name
ORDER BY TotalStock ASC;
```

### Database Backup (via SSMS)

1. In SSMS, right-click `db47422` → **Tasks** → **Back Up...**
2. Select **Full** backup type
3. Choose destination (local file)
4. Click **OK**

> [!IMPORTANT]
> MonsterASP may also offer automated backups through their control panel. Check your plan features.

---

## Environment Summary

| Environment | DB Server | Connection | Used For |
|---|---|---|---|
| **Local Dev** | `(localdb)\MSSQLLocalDB` | `appsettings.Development.json` | Day-to-day development |
| **Production** | `db47422.databaseasp.net` | `appsettings.json` | Live deployment on MonsterASP |

---

## Deployment Checklist (Quick Reference)

- [ ] Schema.sql executed on production DB (or EF migration applied)
- [ ] `appsettings.json` connection string points to production DB
- [ ] JWT SecretKey is production-grade (not the dev dummy)
- [ ] `npm run build` succeeds for frontend
- [ ] `dotnet publish -c Release` succeeds for backend
- [ ] Publish profile imported in Visual Studio
- [ ] Web Deploy completed without errors
- [ ] Login works on live URL
- [ ] API endpoints return data (not 500s)
- [ ] All 6 role users can log in and see correct dashboards

---

*Generated: April 19, 2026*
