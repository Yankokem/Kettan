# Bugfix Requirements Document

## Introduction

The C# backend (Kettan.Server) has 28 compilation errors preventing the application from building. All errors are related to implicit conversions between enum types and string types. The affected enums include UserRole, SubscriptionTier, SubscriptionStatus, InvoiceStatus, MenuItemStatus, PricingMode, ReturnResolution, OrderStatus, TransactionType, and ReferenceType. These errors occur across 10 files in controllers, services, and seeders.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN comparing enum values directly with string values (e.g., `u.Role == "TenantAdmin"`) THEN the system fails to compile with implicit conversion errors

1.2 WHEN assigning string values to enum properties (e.g., `tenant.SubscriptionTier = "Growth"`) THEN the system fails to compile with implicit conversion errors

1.3 WHEN passing enum values where strings are expected in method calls (e.g., `normalizedRoles.Contains(u.Role)`) THEN the system fails to compile with implicit conversion errors

1.4 WHEN using enum values in string contexts without explicit conversion (e.g., in LINQ queries, property assignments, method parameters) THEN the system fails to compile with type mismatch errors

### Expected Behavior (Correct)

2.1 WHEN comparing enum values with string values THEN the system SHALL explicitly convert the enum to string using `.ToString()` or parse the string to enum using `Enum.Parse<T>()` or `Enum.TryParse<T>()`

2.2 WHEN assigning string values to enum properties THEN the system SHALL parse the string to the appropriate enum type using `Enum.TryParse<T>()` with proper validation

2.3 WHEN passing enum values where strings are expected THEN the system SHALL explicitly convert the enum to string using `.ToString()`

2.4 WHEN using enum values in string contexts THEN the system SHALL compile successfully with proper type conversions applied

### Unchanged Behavior (Regression Prevention)

3.1 WHEN enum values are already properly converted to strings THEN the system SHALL CONTINUE TO compile and function correctly

3.2 WHEN string values are already properly parsed to enums THEN the system SHALL CONTINUE TO compile and function correctly

3.3 WHEN the application logic depends on enum comparisons THEN the system SHALL CONTINUE TO produce the same logical results after fixing the type conversions

3.4 WHEN DTOs return enum values as strings THEN the system SHALL CONTINUE TO serialize enums to strings in API responses

3.5 WHEN database queries filter by enum values THEN the system SHALL CONTINUE TO execute the same queries with correct results
