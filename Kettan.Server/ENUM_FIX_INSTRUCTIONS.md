# Fix for InvalidCastException: Enum to String Conversion

## Problem
The database contains old enum values (stored as bytes/TINYINT) but the entity now expects strings (VARCHAR). This causes an `InvalidCastException` when querying the database.

## Root Cause
- The `Tenant` entity properties `SubscriptionTier` and `SubscriptionStatus` were changed from enum to string
- The database schema is correct (nvarchar columns)
- BUT existing data in the database still has old enum byte values (0, 1, 2, etc.)

## Solution

### Option 1: Drop and Recreate Database (RECOMMENDED for Development)

**WARNING: This will delete ALL data in your database!**

1. Stop the running application (close the server)
2. Open a terminal in the `Kettan.Server` directory
3. Run these commands:

```powershell
dotnet ef database drop --force
dotnet ef database update
```

4. Restart your application - it will seed fresh data with correct string values

### Option 2: Update Existing Data (If you need to preserve data)

1. Connect to your database using SQL Server Management Studio or Azure Data Studio
2. Run this SQL script:

```sql
-- Convert SubscriptionStatus enum values to strings
UPDATE Tenants
SET SubscriptionStatus = CASE 
    WHEN SubscriptionStatus = '0' OR SubscriptionStatus = 'Active' THEN 'Active'
    WHEN SubscriptionStatus = '1' OR SubscriptionStatus = 'PendingPayment' THEN 'PendingPayment'
    WHEN SubscriptionStatus = '2' OR SubscriptionStatus = 'Suspended' THEN 'Suspended'
    WHEN SubscriptionStatus = '3' OR SubscriptionStatus = 'Canceled' THEN 'Canceled'
    WHEN SubscriptionStatus = '4' OR SubscriptionStatus = 'Expired' THEN 'Expired'
    ELSE SubscriptionStatus
END;

-- Convert SubscriptionTier enum values to strings
UPDATE Tenants
SET SubscriptionTier = CASE 
    WHEN SubscriptionTier = '0' OR SubscriptionTier = 'Starter' THEN 'Starter'
    WHEN SubscriptionTier = '1' OR SubscriptionTier = 'Growth' THEN 'Growth'
    WHEN SubscriptionTier = '2' OR SubscriptionTier = 'Enterprise' THEN 'Enterprise'
    ELSE SubscriptionTier
END;

-- Verify the changes
SELECT TenantId, Name, SubscriptionTier, SubscriptionStatus
FROM Tenants;
```

3. Restart your application

### Option 3: Delete Tenant Data Only (Preserve other data)

If you want to keep other data but reset tenants:

```sql
-- Delete all tenants and related data
DELETE FROM Users WHERE TenantId IS NOT NULL;
DELETE FROM Branches;
DELETE FROM Tenants;

-- Restart your application - it will seed fresh tenant data
```

## Verification

After applying any solution:

1. Start your application
2. Check the console for any errors during seeding
3. Try to access the application
4. Verify that tenants are created with correct string values

## Enum Value Mappings

### SubscriptionStatus Enum → String
- 0 → "Active"
- 1 → "PendingPayment"
- 2 → "Suspended"
- 3 → "Canceled"
- 4 → "Expired"

### SubscriptionTier Enum → String
- 0 → "Starter"
- 1 → "Growth"
- 2 → "Enterprise"

## Files Modified in This Fix

1. `Kettan.Server/Entities/Tenant.cs` - Changed properties to string
2. `Kettan.Server/Services/Subscription/SubscriptionService.cs` - Added .ToString() conversions
3. `Kettan.Server/Controllers/TenantsController.cs` - Removed .ToString() from string properties
4. `Kettan.Server/Controllers/AdminController.cs` - Added .ToString() for enum comparisons
5. `Kettan.Server/Middleware/SubscriptionCheckMiddleware.cs` - Added .ToString() for enum comparisons
6. `Kettan.Server/Data/Seeders/SubscriptionTenantSeeder.cs` - Uses string values

## Prevention

To avoid this issue in the future:
- Always create a migration when changing property types
- Test with a fresh database after entity changes
- Consider using value converters in EF Core for enum-to-string mappings
