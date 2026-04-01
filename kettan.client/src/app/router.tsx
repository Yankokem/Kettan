import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/Layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LoginPage } from '../features/auth/LoginPage';
import { BranchesPage } from '../features/branches/BranchesPage';
import { StaffPage } from '../features/staff/StaffPage';
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

const staffRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff',
  component: StaffPage,
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
  layoutRoute.addChildren([indexRoute, branchesRoute, staffRoute]),
  loginRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
