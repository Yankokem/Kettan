using Microsoft.EntityFrameworkCore;
using Kettan.Server.Entities;

namespace Kettan.Server.Data;

public class ApplicationDbContext : DbContext
{
    // Dummy Tenant ID to be used initially before we hook up proper Auth/JWT claims
    private readonly int _currentTenantId = 1;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<Branch> Branches { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<Batch> Batches { get; set; } = null!;
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; } = null!;
    public DbSet<SupplyRequest> SupplyRequests { get; set; } = null!;
    public DbSet<SupplyRequestItem> SupplyRequestItems { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderAllocation> OrderAllocations { get; set; } = null!;
    public DbSet<Shipment> Shipments { get; set; } = null!;
    public DbSet<Return> Returns { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Optional: Enforce email requirement to be totally unique per platform
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // 1. Global Query Filters for Single-Tenant Data Isolation
        modelBuilder.Entity<Branch>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Item>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Batch>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<InventoryTransaction>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<SupplyRequest>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Order>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Shipment>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Return>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<OrderAllocation>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<SupplyRequestItem>().HasQueryFilter(e => e.TenantId == _currentTenantId);

        // Custom filter for User: either they belong to the current tenant, or they are a SuperAdmin (null)
        modelBuilder.Entity<User>().HasQueryFilter(e => e.TenantId == null || e.TenantId == _currentTenantId);

        // 2. Prevent Cascading Deletes to mimic strict enterprise behavior
        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}