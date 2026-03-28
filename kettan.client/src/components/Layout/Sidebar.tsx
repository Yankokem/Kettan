import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Divider 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import { Link, useLocation } from '@tanstack/react-router';

const DRAWER_WIDTH = 260;

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const NAVIGATION_ITEMS = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Cafes', icon: <StorefrontIcon />, path: '/cafes' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Staff', icon: <PeopleIcon />, path: '/staff' },
];

export function Sidebar({ mobileOpen, onDrawerToggle }: SidebarProps) {
  // Normally `useLocation` works directly with TanStack router
  const location = useLocation();

  const drawerContent = (
    <Box className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800">
      <Box className="h-16 flex items-center px-6">
        <Typography variant="h6" className="font-bold text-primary-main tracking-tight">
          KETTAN SAAS
        </Typography>
      </Box>
      <Divider className="dark:border-slate-800" />
      <List className="px-3 mt-4 space-y-1">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <Link to={item.path} className="w-full no-underline text-inherit" onClick={onDrawerToggle}>
                <ListItemButton 
                  selected={isActive}
                  className={`rounded-lg py-2.5 transition-colors ${
                    isActive 
                      ? 'bg-primary-main/10 text-primary-main dark:bg-primary-main/20' 
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ListItemIcon className={`min-w-[40px] ${isActive ? 'text-primary-main' : 'text-inherit'}`}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      className: 'font-medium text-sm'
                    }} 
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
      <Box className="mt-auto p-4">
         {/* Could put a small user profile or logout button here */}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }} 
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
