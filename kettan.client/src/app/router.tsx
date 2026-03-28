import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Box, Typography } from '@mui/material';
import { AppLayout } from '../components/Layout/AppLayout';

// Root Route uses the AppLayout framework
const rootRoute = createRootRoute({
  component: AppLayout,
});

// Main Dashboard entry point
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Dashboard() {
    return (
      <Box className="space-y-6">
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
          Dashboard
        </Typography>
        
        {/* Example Grid using Tailwind inside MUI */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Box className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Total Cafes</Typography>
             <Typography variant="h3" className="mt-2 text-gray-900 dark:text-white font-bold">12</Typography>
           </Box>
           <Box className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Active Staff</Typography>
             <Typography variant="h3" className="mt-2 text-gray-900 dark:text-white font-bold">84</Typography>
           </Box>
           <Box className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Low Inventory Alerts</Typography>
             <Typography variant="h3" className="mt-2 text-secondary-main font-bold">3</Typography>
           </Box>
        </Box>
      </Box>
    );
  },
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
