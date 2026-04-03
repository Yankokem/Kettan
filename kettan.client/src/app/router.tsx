import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/Layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LoginPage } from '../features/auth/LoginPage';
import { BranchesPage } from '../features/branches/BranchesPage';
import { AddBranchPage } from '../features/branches/AddBranchPage';
import { BranchProfilePage } from '../features/branches/BranchProfilePage';
import { StaffPage } from '../features/staff/StaffPage';
import { AddStaffPage } from '../features/staff/AddStaffPage';
import { StaffProfilePage } from '../features/staff/StaffProfilePage';
import { InventoryPage } from '../features/hq-inventory/InventoryPage';
import { AddInventoryPage } from '../features/hq-inventory/AddInventoryPage';
import { InventoryItemProfilePage } from '../features/hq-inventory/InventoryItemProfilePage';
import { BranchInventoryDetailPage } from '../features/branches/BranchInventoryDetailPage';
import { CompanyProfilePage } from '../features/company/CompanyProfilePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { OrderTrackingPage } from '../features/orders/OrderTrackingPage';
import { GlobalTrackingPage } from '../features/orders/GlobalTrackingPage';
import { NewOrderRequestPage } from '../features/orders/NewOrderRequestPage';
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

const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory',
  component: InventoryPage,
});

const addInventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/add',
  component: AddInventoryPage,
});

const inventoryProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hq-inventory/$itemId',
  component: InventoryItemProfilePage,
});

const branchInventoryDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/branch-inventory/$branchId',
  component: BranchInventoryDetailPage,
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

const orderDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/$orderId',
  component: OrderDetailPage,
});

const orderTrackingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/$orderId/tracking',
  component: OrderTrackingPage,
});

const globalTrackingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/active-tracking',
  component: GlobalTrackingPage,
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
    addStaffRoute,
    staffProfileRoute,
    inventoryRoute,
    addInventoryRoute,
    inventoryProfileRoute,
    branchInventoryDetailRoute,
    companyProfileRoute,
    settingsRoute,
    reportsRoute,
    ordersRoute,
    newOrderRoute,
    orderDetailRoute,
    orderTrackingRoute,
    globalTrackingRoute
  ]),
  loginRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
