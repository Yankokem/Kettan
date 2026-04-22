using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class EmployeeSeeder
{
    public static async Task EnsureEmployeesAsync(
        ApplicationDbContext context,
        Tenant tenant,
        BranchContext branches,
        CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        var seeds = new[]
        {
            new EmployeeSeed("Miguel", "Santos", "Warehouse Supervisor", "09170000001", today.AddYears(-2), null),
            new EmployeeSeed("Lara", "Reyes", "Inventory Clerk", "09170000002", today.AddYears(-1), null),
            new EmployeeSeed("Paolo", "Cruz", "Barista", "09170000003", today.AddMonths(-10), SeedConstants.MainBranchName),
            new EmployeeSeed("Nina", "Lopez", "Cashier", "09170000004", today.AddMonths(-8), SeedConstants.MainBranchName)
        };

        var existingEmployees = await context.Set<Employee>()
            .IgnoreQueryFilters()
            .Where(e => e.TenantId == tenant.TenantId)
            .ToListAsync(cancellationToken);

        foreach (var seed in seeds)
        {
            var employee = existingEmployees.FirstOrDefault(e =>
                e.FirstName == seed.FirstName
                && e.LastName == seed.LastName
                && e.Position == seed.Position);

            int? branchId = null;
            if (!string.IsNullOrWhiteSpace(seed.BranchName))
            {
                branchId = BranchSeeder.ResolveBranch(branches, seed.BranchName).BranchId;
            }

            if (employee is null)
            {
                employee = new Employee
                {
                    TenantId = tenant.TenantId,
                    BranchId = branchId,
                    FirstName = seed.FirstName,
                    LastName = seed.LastName,
                    Position = seed.Position,
                    ContactNumber = seed.ContactNumber,
                    DateHired = seed.DateHired,
                    IsActive = true
                };

                context.Set<Employee>().Add(employee);
            }
            else
            {
                employee.TenantId = tenant.TenantId;
                employee.BranchId = branchId;
                employee.FirstName = seed.FirstName;
                employee.LastName = seed.LastName;
                employee.Position = seed.Position;
                employee.ContactNumber = seed.ContactNumber;
                employee.DateHired = seed.DateHired;
                employee.IsActive = true;
                employee.IsDeleted = false;
                employee.DeletedAt = null;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private sealed record EmployeeSeed(
        string FirstName,
        string LastName,
        string Position,
        string ContactNumber,
        DateTime DateHired,
        string? BranchName);
}
