using Microsoft.EntityFrameworkCore;
using Kettan.Server.Entities;
using Kettan.Server.Enums;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUserService;
    private int? CurrentTenantId => _currentUserService?.IsAuthenticated == true ? _currentUserService.TenantId : null;
    private bool IsTenantlessAuthenticatedContext => _currentUserService?.IsAuthenticated == true && !_currentUserService.TenantId.HasValue;

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
    public DbSet<MenuItem> MenuItems { get; set; } = null!;
    public DbSet<MenuItemIngredient> MenuItemIngredients { get; set; } = null!;
    public DbSet<ConsumptionLog> ConsumptionLogs { get; set; } = null!;
    public DbSet<ConsumptionLogItem> ConsumptionLogItems { get; set; } = null!;
    public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; } = null!;
    public DbSet<ReturnItem> ReturnItems { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    
    // New Entities
    public DbSet<BranchItemSetting> BranchItemSettings { get; set; } = null!;

    public DbSet<InventoryCategory> InventoryCategories { get; set; } = null!;
    public DbSet<ItemCategory> ItemCategories { get; set; } = null!;
    public DbSet<BundleItem> BundleItems { get; set; } = null!;
    public DbSet<Employee> Employees { get; set; } = null!;

    public DbSet<Vehicle> Vehicles { get; set; } = null!;
    public DbSet<Supplier> Suppliers { get; set; } = null!;
    public DbSet<ItemSupplier> ItemSuppliers { get; set; } = null!;
    public DbSet<MenuCategory> MenuCategories { get; set; } = null!;
    public DbSet<MenuTag> MenuTags { get; set; } = null!;
    public DbSet<MenuItemTag> MenuItemTags { get; set; } = null!;
    public DbSet<MenuVariant> MenuVariants { get; set; } = null!;
    public DbSet<VariantIngredient> VariantIngredients { get; set; } = null!;
    public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; } = null!;
    public DbSet<TenantSubscription> TenantSubscriptions { get; set; } = null!;
    public DbSet<SubscriptionInvoice> SubscriptionInvoices { get; set; } = null!;
    public DbSet<SubscriptionPayment> SubscriptionPayments { get; set; } = null!;
    public DbSet<RegistrationOtp> RegistrationOtps { get; set; } = null!;
    public DbSet<RegistrationVerificationSession> RegistrationVerificationSessions { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<OrderMessage> OrderMessages { get; set; } = null!;
    public DbSet<ReturnMessage> ReturnMessages { get; set; } = null!;
    public DbSet<DocumentSequence> DocumentSequences { get; set; } = null!;
    public DbSet<UserDevice> UserDevices { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Document Sequence
        modelBuilder.Entity<DocumentSequence>()
            .HasIndex(ds => new { ds.TenantId, ds.DocumentType, ds.PeriodKey })
            .IsUnique();

        // Transaction Code Unique Constraints
        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.TenantId, o.TransactionCode })
            .IsUnique()
            .HasFilter("[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

        modelBuilder.Entity<SupplyRequest>()
            .HasIndex(sr => new { sr.TenantId, sr.TransactionCode })
            .IsUnique()
            .HasFilter("[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");


        modelBuilder.Entity<Return>()
            .HasIndex(r => new { r.TenantId, r.TransactionCode })
            .IsUnique()
            .HasFilter("[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

        modelBuilder.Entity<InventoryTransaction>()
            .HasIndex(it => new { it.TenantId, it.TransactionCode })
            .IsUnique()
            .HasFilter("[TransactionCode] IS NOT NULL AND [TransactionCode] != ''");

        // Required email index
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // UserDevice: index on DeviceToken for fast lookup during login
        modelBuilder.Entity<UserDevice>()
            .HasIndex(ud => ud.DeviceToken);

        modelBuilder.Entity<User>()
            .HasIndex(u => new { u.TenantId, u.BranchId, u.IsActive, u.IsDeleted });

        modelBuilder.Entity<Branch>()
            .HasIndex(b => new { b.TenantId, b.IsActive, b.IsDeleted });

        modelBuilder.Entity<RegistrationOtp>()
            .HasIndex(o => new { o.Email, o.IsUsed, o.ExpiresAtUtc });

        modelBuilder.Entity<RegistrationVerificationSession>()
            .HasIndex(s => s.VerificationToken)
            .IsUnique();

        // Enforce one shipment per order.
        modelBuilder.Entity<Shipment>()
            .HasIndex(s => s.OrderId)
            .IsUnique();

        modelBuilder.Entity<BranchItemSetting>()
            .HasIndex(e => new { e.BranchId, e.ItemId })
            .IsUnique();


        // MenuItemTag Composite Key
        modelBuilder.Entity<MenuItemTag>()
            .HasKey(mt => new { mt.MenuItemId, mt.TagId });

        // AuditLog Indexes for performance
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.TenantId);
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.OccurredAt);
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.TenantId, a.OccurredAt });
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.BranchId, a.OccurredAt });
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.TenantId, a.BranchId, a.OccurredAt });
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.UserId, a.OccurredAt });

        // BundleItem self-reference check (NoSelfReference constraint cannot be easily added here without raw SQL, 
        // but we handle the relationships here)
        modelBuilder.Entity<BundleItem>()
            .HasOne(b => b.ParentItem)
            .WithMany()
            .HasForeignKey(b => b.ParentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BundleItem>()
            .HasOne(b => b.ChildItem)
            .WithMany()
            .HasForeignKey(b => b.ChildItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global Query Filters (Tenant Isolation & Soft Deletes)

        // Navigation configurations to resolve ambiguity
        modelBuilder.Entity<Branch>()
            .HasOne(b => b.OwnerUser)
            .WithMany()
            .HasForeignKey(b => b.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Branch>()
            .HasOne(b => b.ManagerUser)
            .WithMany()
            .HasForeignKey(b => b.ManagerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Tenant>()
            .HasOne(t => t.CurrentSubscription)
            .WithMany()
            .HasForeignKey(t => t.CurrentSubscriptionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Models with IsDeleted AND ITenantEntity
        modelBuilder.Entity<Branch>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Item>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<SupplyRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Order>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Shipment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Return>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<MenuItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<InventoryCategory>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ItemCategory>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<BundleItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<Vehicle>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Supplier>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);

        // ItemSupplier: one row per (Item, Supplier) pair — no global filter needed (filtered via parent)
        modelBuilder.Entity<ItemSupplier>()
            .HasIndex(e => new { e.ItemId, e.SupplierId })
            .IsUnique();
        modelBuilder.Entity<MenuCategory>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<MenuTag>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);

        // Models with ITenantEntity but NO IsDeleted
        modelBuilder.Entity<Batch>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<InventoryTransaction>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ConsumptionLog>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ConsumptionLogItem>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Notification>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<OrderMessage>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ReturnMessage>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<OrderStatusHistory>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<OrderAllocation>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<SupplyRequestItem>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ReturnItem>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<MenuItemIngredient>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<BranchItemSetting>().HasQueryFilter(e => e.TenantId == CurrentTenantId);

        // Models with IsDeleted but NO ITenantEntity
        modelBuilder.Entity<Tenant>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SubscriptionPlan>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TenantSubscription>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<MenuVariant>().HasQueryFilter(e => !e.IsDeleted);

        // Custom User Filter
        modelBuilder.Entity<User>().HasQueryFilter(e =>
            !e.IsDeleted &&
            (
                e.TenantId == CurrentTenantId ||
                (IsTenantlessAuthenticatedContext && e.TenantId == null)
            ));

        // Note: Models without TenantId and IsDeleted (like VariantIngredient, SubscriptionInvoice,
        // SubscriptionPayment, AuditLog) aren't filtered here directly.

        // ============================================================
        // Enum to tinyint conversions
        // ============================================================
        
        modelBuilder.Entity<User>()
            .Property(e => e.Role)
            .HasConversion<byte>();

        modelBuilder.Entity<User>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<Employee>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<MenuItem>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<MenuVariant>()
            .Property(e => e.PricingMode)
            .HasConversion<byte>();

        modelBuilder.Entity<Vehicle>()
            .Property(e => e.VehicleType)
            .HasConversion<byte>();

        modelBuilder.Entity<ConsumptionLog>()
            .Property(e => e.Method)
            .HasConversion<byte>();

        modelBuilder.Entity<ConsumptionLog>()
            .Property(e => e.Shift)
            .HasConversion<byte?>();

        modelBuilder.Entity<Order>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<OrderStatusHistory>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<SupplyRequest>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<SupplyRequest>()
            .Property(e => e.RequestType)
            .HasConversion<byte>();

        modelBuilder.Entity<SupplyRequest>()
            .Property(e => e.Priority)
            .HasConversion<byte>();

        modelBuilder.Entity<SupplyRequest>()
            .Property(e => e.DispatchWindow)
            .HasConversion<byte>();


        modelBuilder.Entity<Return>()
            .Property(e => e.Resolution)
            .HasConversion<byte>();

        modelBuilder.Entity<Return>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<ReturnItem>()
            .Property(e => e.ReasonCode)
            .HasConversion<byte>();

        modelBuilder.Entity<ReturnItem>()
            .Property(e => e.Disposition)
            .HasConversion<byte>();

        modelBuilder.Entity<InventoryTransaction>()
            .Property(e => e.TransactionType)
            .HasConversion<byte>();

        modelBuilder.Entity<InventoryTransaction>()
            .Property(e => e.ReferenceType)
            .HasConversion<byte?>();

        modelBuilder.Entity<Notification>()
            .Property(e => e.Type)
            .HasConversion<byte>();

        modelBuilder.Entity<Notification>()
            .Property(e => e.ReferenceType)
            .HasConversion<byte?>();

        modelBuilder.Entity<TenantSubscription>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<TenantSubscription>()
            .Property(e => e.BillingCycle)
            .HasConversion<byte>();

        modelBuilder.Entity<Tenant>()
            .Property(e => e.SubscriptionStatus)
            .HasConversion<byte>();

        modelBuilder.Entity<Tenant>()
            .Property(e => e.SubscriptionTier)
            .HasConversion<byte>();

        modelBuilder.Entity<SubscriptionInvoice>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<SubscriptionPayment>()
            .Property(e => e.Status)
            .HasConversion<byte>();

        modelBuilder.Entity<SubscriptionPayment>()
            .Property(e => e.PaymentMethod)
            .HasConversion<byte?>();

        modelBuilder.Entity<SubscriptionPayment>()
            .Property(e => e.Provider)
            .HasConversion<byte?>();

        // ============================================================
        // DateTime2(3) precision for all DateTime columns
        // ============================================================
        
        // Configure datetime2(3) precision for all DateTime properties across all entities
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetColumnType("datetime2(3)");
                }
            }
        }

        // Prevent Cascading Deletes
        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}
