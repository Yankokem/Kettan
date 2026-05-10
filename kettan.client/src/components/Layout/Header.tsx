import { useState } from 'react';
import { AppBar, IconButton, Toolbar, Box, Avatar, Typography, Menu, MenuItem } from '@mui/material';
import MenuIcon          from '@mui/icons-material/Menu';

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import { useThemeStore } from '../../store/useThemeStore';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { NotificationBell } from '../UI/NotificationBell';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
  onDrawerToggle: () => void;
  drawerWidth: number | string;
}

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/supply-requests': 'Supply Requests',
  '/consumption': 'Consumption Logs',
  '/orders':    'Order Processing',
  '/returns':   'Returns Management',
  '/branches':  'Branches',
  '/branches/add': 'Add New Branch',
  '/company-profile': 'Company Profile',
  '/hq-inventory': 'HQ Inventory & Stock',
  '/hq-inventory/add': 'Add Inventory Item',
  '/menu':      'Menu & Recipes',
  '/staff':     'Staff Directory',
  '/staff/add': 'Add Staff Member',
  '/tenants':   'Tenant Management',
  '/platform-users': 'Platform Users',
  '/analytics': 'Platform Analytics',
  '/help':      'Help & Support',
  '/settings':  'Settings',
  '/audit-logs': 'Audit Logs',
  '/reports':   'Finance & Reports',
  '/profile':   'My Profile',
  '/profile/edit': 'Edit Profile',
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/':          'Kettan · Café Chain Operations',
  '/supply-requests': 'Create and submit branch replenishment requests to HQ.',
  '/consumption': 'Track branch stock consumption from direct use and sales.',
  '/branches':  'Manage branch operations, network details, and network growth.',
  '/branches/add': 'Register a new branch within the tenant network.',
  '/company-profile': 'Manage your company profile and billing.',
  '/hq-inventory': 'Track warehouse stock, raw ingredients, and reorder levels globally.',
  '/hq-inventory/add': 'Register new coffee, syrups, packaging, or equipment.',
  '/menu':      'Manage your coffee menu, recipes, and ingredient compositions.',
  '/staff':     'Manage your team members, roles, and branch assignments.',
  '/staff/add': 'Create a new staff account with role and access permissions.',
  '/tenants':   'Monitor and manage all platform subscribers, their plans, and account status.',
  '/platform-users': 'Manage and monitor all user accounts across the entire platform.',
  '/analytics': 'Deep dive into platform-wide performance, growth, and usage metrics.',
  '/help':      'Access support resources, documentation, and contact platform helpdesk.',
  '/settings':  'System settings, user roles, and platform permissions.',
  '/audit-logs': 'Track key actions across returns and admin workflows.',
  '/reports':   'Financial analytics, performance leaderboards, and aggregated invoices.',
  '/profile':   'View your account information and settings.',
  '/profile/edit': 'Update your personal information and account settings.',
};

export function Header({ onDrawerToggle, drawerWidth }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();
  const { mode } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate({ to: '/login' });
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate({ to: '/profile' });
  };


  const getParentResource = (path: string) => {
    const segments = path.split('/');
    if (segments.length > 2) {
      return `/${segments[1]}`;
    }
    return path;
  };
  
  const basePath = getParentResource(location.pathname);
  let pageTitle = PAGE_TITLES[location.pathname] ?? PAGE_TITLES[basePath] ?? 'Kettan';
  let pageDesc = PAGE_DESCRIPTIONS[location.pathname] ?? PAGE_DESCRIPTIONS[basePath] ?? 'Kettan · Café Chain Operations';

  if (location.pathname === '/' && user?.role === 'SuperAdmin') {
    pageTitle = 'Admin Dashboard';
    pageDesc = 'Global platform overview, tenant activities, and system health.';
  }

  // Branch User overrides for Inventory
  if (user?.branchId && (basePath === '/hq-inventory' || location.pathname === '/hq-inventory')) {
    pageTitle = 'My Branch Inventory & Stock';
    pageDesc = 'Track your local branch stock levels, raw ingredients, and reorder levels.';
  }

  const showPageMeta = Boolean(pageTitle.trim());

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml:    { sm: `${drawerWidth}px` },
        background: 'rgba(250, 245, 239, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(107, 76, 42, 0.1)',
        boxShadow: '0 4px 20px rgba(46, 31, 12, 0.03)',
        color: 'text.primary',
        transition: 'margin-left 220ms cubic-bezier(0.4,0,0.2,1), width 220ms cubic-bezier(0.4,0,0.2,1)',
        '.dark &': {
          background: 'rgba(46, 31, 20, 0.85)',
          color: '#E8D3A9',
          borderBottomColor: 'rgba(201,168,77,0.08)',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <Toolbar
        sx={{
          height: 64,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ display: { sm: 'none' }, color: '#6B4C2A' }}
          >
            <MenuIcon />
          </IconButton>

          {showPageMeta ? (
            <Box>
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#2E1F0C',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  '.dark &': { color: '#E8D3A9' },
                }}
              >
                {pageTitle}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: '#7A5B37',
                  letterSpacing: '0.01em',
                  '.dark &': { color: 'rgba(201,168,77,0.55)' },
                }}
              >
                {pageDesc}
              </Typography>
            </Box>
          ) : null}
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          {/* Notifications */}
          <NotificationBell />

          {/* Divider */}
          <Box sx={{ width: '3px', height: 24, background: '#6B4C2A', opacity: 0.4, mx: 1.5 }} />

          {/* Account Group */}
          <Box 
            onClick={handleMenuOpen}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.2,
              pl: 1,
              py: 0.5,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                mr: 0.2
              }}
            >
              <Typography 
                sx={{ 
                  fontSize: 13.5, 
                  fontWeight: 700, 
                  color: '#2E1F0C',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  '.dark &': { color: '#E8D3A9' }
                }}
              >
                {user?.name || 'Super Admin'}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: 10.5, 
                  color: '#8C6B43',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  opacity: 0.8,
                  '.dark &': { color: 'rgba(201,168,77,0.7)' }
                }}
              >
                {user?.role || 'admin'}
              </Typography>
            </Box>
            
            <Avatar
              alt={user?.name || 'User'}
              src={user?.imageUrl ?? undefined}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                border: '1px solid rgba(201,168,77,0.2)',
                background: 'linear-gradient(135deg, #6B4C2A 0%, #C9A84C 100%)',
              }}
            >
              {!user?.imageUrl && <AccountCircleRoundedIcon sx={{ fontSize: 20 }} />}
            </Avatar>
            
            <ExpandMoreRoundedIcon 
              sx={{ 
                fontSize: 20,
                color: '#8C6B43',
                transform: menuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 240ms cubic-bezier(0.4, 0, 0.2, 1)',
              }} 
            />
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transitionDuration={200}
            autoFocus={false}
            PaperProps={{
              elevation: 0,
              sx: {
                mt: 1.5,
                minWidth: 180,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'rgba(201,168,77,0.12)',
                boxShadow: '0 8px 24px rgba(46, 31, 12, 0.1)',
                background: mode === 'dark' ? '#2E1F14' : '#FAF5EF',
                backdropFilter: 'blur(8px)',
                overflow: 'visible',
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 24,
                  width: 10,
                  height: 10,
                  bgcolor: mode === 'dark' ? '#2E1F14' : '#FAF5EF',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  borderLeft: '1px solid',
                  borderTop: '1px solid',
                  borderColor: 'rgba(201,168,77,0.12)',
                },
              },
            }}
          >
            <MenuItem 
              onClick={handleProfile} 
              sx={{ 
                fontSize: 13, 
                fontWeight: 600, 
                py: 1.2, 
                px: 2,
                gap: 1.2,
                transition: 'all 160ms',
                '&:hover': {
                  bgcolor: 'transparent !important',
                  color: '#6B4C2A',
                }
              }}
            >
              <AccountCircleRoundedIcon sx={{ fontSize: 18, color: '#8C6B43' }} />
              My Profile
            </MenuItem>
            <Box sx={{ my: 0.5, borderTop: '1px solid', borderColor: 'rgba(201,168,77,0.06)' }} />
            <MenuItem 
              onClick={handleLogout} 
              sx={{ 
                fontSize: 13, 
                fontWeight: 600, 
                py: 1.2, 
                px: 2,
                gap: 1.2,
                color: '#B91C1C',
                transition: 'all 160ms',
                '&:hover': {
                  bgcolor: 'transparent !important',
                  color: '#B91C1C',
                }
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 18 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
