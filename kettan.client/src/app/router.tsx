import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/Layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LoginPage } from '../features/auth/LoginPage';
import { BranchesPage } from '../features/branches/BranchesPage';
import { AddBranchPage } from '../features/branches/AddBranchPage';
import { BranchProfilePage } from '../features/branches/BranchProfilePage';
import { StaffPage } from '../features/staff/StaffPage';
import { StaffProfilePage } from '../features/staff/StaffProfilePage';
import { InventoryPage } from '../features/hq-inventory/InventoryPage';
import { InventoryItemProfilePage } from '../features/hq-inventory/InventoryItemProfilePage';
import InventoryTransactionPage from '../features/hq-inventory/InventoryTransactionPage';
import { CompanyProfilePage } from '../features/company/CompanyProfilePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { NewOrderRequestPage } from '../features/orders/NewOrderRequestPage';
import { PickingQueuePage } from '../features/orders/PickingQueuePage';
import { ShippingQueuePage } from '../features/orders/ShippingQueuePage';
import { MenuItemsPage } from '../features/menu/MenuItemsPage';
import { AddMenuItemPage } from '../features/menu/AddMenuItemPage';
import { MenuItemProfilePage } from '../features/menu/MenuItemProfilePage';
import { SupplyRequestsPage } from '../features/supply-requests/SupplyRequestsPage';
import { ConsumptionPage } from '../features/consumption/ConsumptionPage';
import { ReturnsPage } from '../features/returns/ReturnsPage';
import { useAuthStore } from '../store/useAuthStore';

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

const staffRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff',
  component: StaffPage,
});

const staffProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/$staffId',
  component: StaffProfilePage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory',
  component: InventoryPage,
});

const inventoryTransactionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/transaction',
  component: InventoryTransactionPage,
});

const inventoryProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/$itemId',
  component: InventoryItemProfilePage,
});

const companyProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/company-profile',
  component: CompanyProfilePage,
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

const pickingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/picking',
  component: PickingQueuePage,
});

const shippingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/shipping',
  component: ShippingQueuePage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/$orderId',
  component: OrderDetailPage,
});

const supplyRequestsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/supply-requests',
  component: SupplyRequestsPage,
});

const consumptionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/consumption',
  component: ConsumptionPage,
});

const returnsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/returns',
  component: ReturnsPage,
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

const menuItemProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu/$menuItemId',
  component: MenuItemProfilePage,
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
  layoutRoute.addChildren([
    indexRoute, 
    branchesRoute, 
    addBranchRoute,
    branchProfileRoute,
    staffRoute,
    staffProfileRoute,
    inventoryRoute,
    inventoryTransactionRoute,
    inventoryProfileRoute,
    companyProfileRoute,
    settingsRoute,
    reportsRoute,
    ordersRoute,
    newOrderRoute,
    orderDetailRoute,
    pickingRoute,
    shippingRoute,
    supplyRequestsRoute,
    consumptionRoute,
    returnsRoute,
    menuRoute,
    addMenuItemRoute,
    menuItemProfileRoute
  ]),
  loginRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
