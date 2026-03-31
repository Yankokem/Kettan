using Microsoft.EntityFrameworkCore;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService? currentUserService = null)
        : base(options)
    {
        _currentUserService = currentUserService;
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
        // If TenantId is null (e.g. background job or SuperAdmin), they bypass this global filter.
        modelBuilder.Entity<Branch>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<Item>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<Batch>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<InventoryTransaction>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<SupplyRequest>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<Order>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<Shipment>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<Return>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<OrderAllocation>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);
        modelBuilder.Entity<SupplyRequestItem>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == _currentUserService.TenantId);

        // Custom filter for User: either they belong to the current tenant, or they are a SuperAdmin (null)
        modelBuilder.Entity<User>().HasQueryFilter(e => !_currentUserService!.TenantId.HasValue || e.TenantId == null || e.TenantId == _currentUserService.TenantId);

        // 2. Prevent Cascading Deletes to mimic strict enterprise behavior
        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}