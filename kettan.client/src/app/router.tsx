import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/Layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LoginPage } from '../features/auth/LoginPage';
import { BranchesPage } from '../features/branches/BranchesPage';
import { AddBranchPage } from '../features/branches/AddBranchPage';
import { BranchProfilePage } from '../features/branches/BranchProfilePage';
import { BranchInfoPage } from '../features/branches/BranchInfoPage';
import { StaffPage } from '../features/staff/StaffPage';
import { StaffProfilePage } from '../features/staff/StaffProfilePage';
import { AddStaffPage } from '../features/staff/AddStaffPage';
import { EditStaffPage } from '../features/staff/EditStaffPage';
import { InventoryPage } from '../features/hq-inventory/InventoryPage';
import { InventoryItemProfilePage } from '../features/hq-inventory/InventoryItemProfilePage';
import InventoryTransactionPage from '../features/hq-inventory/InventoryTransactionPage';
import TransactionDetailView from '../features/hq-inventory/TransactionDetailView';
import { CompanyProfilePage } from '../features/company/CompanyProfilePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { MultiBranchSupplyPushDetailPage } from '../features/orders/MultiBranchSupplyPushDetailPage';
import { NewOrderRequestPage } from '../features/orders/NewOrderRequestPage';
import { MenuItemsPage } from '../features/menu/MenuItemsPage';
import { AddMenuItemPage } from '../features/menu/AddMenuItemPage';
import { MenuItemProfilePage } from '../features/menu/MenuItemProfilePage';
import { MenuCategoriesPage } from '../features/menu/MenuCategoriesPage';
import { ItemCategoriesPage } from '../features/hq-inventory/ItemCategoriesPage';
import { SuppliersPage } from '../features/hq-inventory/SuppliersPage';
import { VehicleManagementPage } from '../features/hq-inventory/VehicleManagementPage';
import { SupplyRequestsPage } from '../features/supply-requests/SupplyRequestsPage';
import { SupplyRequestCreatePage } from '../features/supply-requests/SupplyRequestCreatePage';
import { SupplyRequestDetailPage } from '../features/supply-requests/SupplyRequestDetailPage';
import { SupplyRequestEditDraftPage } from '../features/supply-requests/SupplyRequestEditDraftPage';
import { ConsumptionPage } from '../features/consumption/ConsumptionPage';
import { ConsumptionCreatePage } from '../features/consumption/ConsumptionCreatePage';
import { ReturnsPage } from '../features/returns/ReturnsPage';
import { ReturnDetailPage } from '../features/returns/ReturnDetailPage';
import { ReturnCreatePage } from '../features/returns/ReturnCreatePage';
import { HomePage } from '../features/marketing/HomePage';
import { FeaturesPage } from '../features/marketing/FeaturesPage';
import { PricingPage } from '../features/marketing/PricingPage';
import { RegisterPage } from '../features/marketing/RegisterPage';
import { RegisterOtpPage } from '../features/marketing/RegisterOtpPage';
import { RegisterOnboardingPage } from '../features/marketing/RegisterOnboardingPage';
import { RegisterSuccessPage } from '../features/marketing/RegisterSuccessPage';
import { AuditLogsPage } from '../features/audit-logs/AuditLogsPage';
import { useAuthStore } from '../store/useAuthStore';
import { canAccessModule } from '../utils/roleHelpers';
import { TenantsPage } from '../features/super-admin/TenantsPage';
import { TenantProfilePage } from '../features/super-admin/TenantProfilePage';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { UsersManagementPage } from '../features/super-admin/UsersManagementPage';
import { HelpPage } from '../features/support/HelpPage';
import { MarketingLayout } from '../components/Marketing/MarketingLayout';
import { UserProfilePage } from '../features/auth/UserProfilePage';
import { UserProfileEditPage } from '../features/auth/UserProfileEditPage';

// ── Router Setup ───────────────────────────────────────────────────────────
// Base root route, just rendering children
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Pathless route for applying the layout wrapper to authenticated/dashboard routes
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: AppLayout,
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const marketingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/market',
  component: MarketingLayout,
});

const marketingHomeRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/',
  component: HomePage,
});

const marketingFeaturesRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/features',
  component: FeaturesPage,
});

const marketingPricingRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/pricing',
  component: PricingPage,
});

const marketingRegisterRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/register',
  component: RegisterPage,
});

const marketingRegisterOtpRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/register/otp',
  component: RegisterOtpPage,
});

const marketingRegisterOnboardingRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/register/onboarding',
  component: RegisterOnboardingPage,
});

const marketingRegisterSuccessRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/register/success',
  component: RegisterSuccessPage,
});

// The index route (using the layout wrapper)
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: DashboardPage,
});

const branchesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/branches',
  component: BranchesPage,
});

const addBranchRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/branches/add',
  component: AddBranchPage,
});

const branchProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/branches/$branchId',
  component: BranchProfilePage,
});

const branchInfoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/branch-profile',
  component: BranchInfoPage,
});

const staffRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff',
  component: StaffPage,
});

const addStaffRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/add',
  component: AddStaffPage,
});

const staffProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/$staffId',
  component: StaffProfilePage,
});

const editStaffRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/$staffId/edit',
  component: EditStaffPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      search: (search.search as string) || undefined,
    } as { search?: string };
  },
  component: InventoryPage,
});

const inventoryTransactionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/transaction',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      itemId: (search.itemId as string) || undefined,
      itemIds: (search.itemIds as string) || undefined,
    } as { itemId?: string; itemIds?: string };
  },
  component: InventoryTransactionPage,
});

const itemCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/categories',
  component: ItemCategoriesPage,
});

const vehiclesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/vehicles',
  component: VehicleManagementPage,
});

const suppliersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/suppliers',
  component: SuppliersPage,
});

const inventoryProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/$itemId',
  component: InventoryItemProfilePage,
});

const transactionDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/transactions/$transactionId',
  component: TransactionDetailView,
});

const companyProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/company-profile',
  component: CompanyProfilePage,
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (!role || !canAccessModule(role, 'company-profile')) {
      throw redirect({ to: '/' });
    }
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/settings',
  component: SettingsPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reports',
  component: ReportsPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders',
  component: OrdersPage,
});

const newOrderRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/new',
  component: NewOrderRequestPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/$orderId',
  component: OrderDetailPage,
});

const multiBranchSupplyPushDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/multi-branch/$batchId',
  component: MultiBranchSupplyPushDetailPage,
});

const supplyRequestsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/supply-requests',
  component: SupplyRequestsPage,
});

const supplyRequestCreateRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/supply-requests/new',
  component: SupplyRequestCreatePage,
});

const supplyRequestDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/supply-requests/$requestId',
  component: SupplyRequestDetailPage,
});

const supplyRequestEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/supply-requests/$requestId/edit',
  component: SupplyRequestEditDraftPage,
});

const consumptionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/consumption',
  component: ConsumptionPage,
});

const consumptionCreateRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/consumption/new',
  component: ConsumptionCreatePage,
});

const returnsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/returns',
  component: ReturnsPage,
});

const returnCreateRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/returns/new',
  component: ReturnCreatePage,
});

const returnDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/returns/$returnId',
  component: ReturnDetailPage,
});

const auditLogsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/audit-logs',
  component: AuditLogsPage,
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (!role || !canAccessModule(role, 'audit-logs')) {
      throw redirect({ to: '/' });
    }
  },
});

const menuRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu',
  component: MenuItemsPage,
});

const addMenuItemRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu/add',
  component: AddMenuItemPage,
});

const menuCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu/categories',
  component: MenuCategoriesPage,
});

const menuItemProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu/$menuItemId',
  component: MenuItemProfilePage,
});

const tenantsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tenants',
  component: TenantsPage,
});

const tenantProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tenants/$tenantId',
  component: TenantProfilePage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/analytics',
  component: AnalyticsPage,
});

const platformUsersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/platform-users',
  component: UsersManagementPage,
});

const helpRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/help',
  component: HelpPage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: UserProfilePage,
});

const userProfileEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile/edit',
  component: UserProfileEditPage,
});

// The login route (independent of layout workspace)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
});

const routeTree = rootRoute.addChildren([
  marketingRoute.addChildren([
    marketingHomeRoute,
    marketingFeaturesRoute,
    marketingPricingRoute,
    marketingRegisterRoute,
    marketingRegisterOtpRoute,
    marketingRegisterOnboardingRoute,
    marketingRegisterSuccessRoute,
  ]),
  layoutRoute.addChildren([
    indexRoute, 
    branchesRoute, 
    addBranchRoute,
    branchProfileRoute,
    staffRoute,
    addStaffRoute,
    staffProfileRoute,
    editStaffRoute,
    inventoryRoute,
    inventoryTransactionRoute,
    itemCategoriesRoute,
    suppliersRoute,
    vehiclesRoute,
    inventoryProfileRoute,
    transactionDetailRoute,
    companyProfileRoute,
    settingsRoute,
    reportsRoute,
    ordersRoute,
    newOrderRoute,
    orderDetailRoute,
    multiBranchSupplyPushDetailRoute,
    supplyRequestsRoute,
    supplyRequestCreateRoute,
    supplyRequestEditRoute,
    supplyRequestDetailRoute,
    consumptionRoute,
    consumptionCreateRoute,
    returnsRoute,
    returnCreateRoute,
    returnDetailRoute,
    auditLogsRoute,
    menuRoute,
    addMenuItemRoute,
    menuCategoriesRoute,
    menuItemProfileRoute,
    tenantsRoute,
    tenantProfileRoute,
    analyticsRoute,
    platformUsersRoute,
    helpRoute,
    userProfileRoute,
    userProfileEditRoute,
    branchInfoRoute,
  ]),
  loginRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
