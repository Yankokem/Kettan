-- Script to convert enum byte values to string values in Tenant table
-- Run this if you have existing data with enum values stored as bytes

-- Update SubscriptionStatus from enum values to strings
UPDATE Tenants
SET SubscriptionStatus = CASE SubscriptionStatus
    WHEN '0' THEN 'Active'
    WHEN '1' THEN 'PendingPayment'
    WHEN '2' THEN 'Suspended'
    WHEN '3' THEN 'Canceled'
    WHEN '4' THEN 'Expired'
    ELSE SubscriptionStatus
END
WHERE SubscriptionStatus IN ('0', '1', '2', '3', '4');

-- Update SubscriptionTier from enum values to strings  
UPDATE Tenants
SET SubscriptionTier = CASE SubscriptionTier
    WHEN '0' THEN 'Starter'
    WHEN '1' THEN 'Growth'
    WHEN '2' THEN 'Enterprise'
    ELSE SubscriptionTier
END
WHERE SubscriptionTier IN ('0', '1', '2');

-- Verify the changes
SELECT TenantId, Name, SubscriptionTier, SubscriptionStatus
FROM Tenants;
