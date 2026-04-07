import { AppBar, IconButton, Toolbar, Box, Avatar, Tooltip, Typography, InputBase } from '@mui/material';
import MenuIcon          from '@mui/icons-material/Menu';
import DarkModeRoundedIcon   from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon  from '@mui/icons-material/LightModeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useThemeStore } from '../../store/useThemeStore';
import { useLocation } from '@tanstack/react-router';
import { NotificationBell } from '../UI/NotificationBell';

interface HeaderProps {
  onDrawerToggle: () => void;
  drawerWidth: number | string;
}

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/orders':    'Order Processing',
  '/picking':   'Picking & Packing',
  '/shipping':  'Shipping & Delivery',
  '/tracking':  'Order Tracking',
  '/returns':   'Returns Management',
  '/branches':  'Branch and Inventory',
  '/branches/add': 'Add New Branch',
  '/company-profile': 'Company Profile',
  '/hq-inventory': 'HQ Inventory & Stock',
  '/hq-inventory/add': 'Add Inventory Item',
  '/branch-inventory': 'Branch Inventory',
  '/staff':     'HR & Staff',
  '/staff/add': 'Add Staff Member',
  '/settings':  'Settings',
  '/reports':   'Finance & Reports',
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/':          'Kettan · Café Chain Operations',
  '/branches':  'Manage branch operations, network details, and track branch inventory.',
  '/branches/add': 'Register a new branch within the tenant network.',
  '/company-profile': 'Manage your company profile and billing.',
  '/hq-inventory': 'Track warehouse stock, raw ingredients, and reorder levels globally.',
  '/hq-inventory/add': 'Register new coffee, syrups, packaging, or equipment.',
  '/branch-inventory': 'Monitor and fulfill stock requirements for individual branch locations.',
  '/staff':     'Manage employee records and role assignments across your network.',
  '/staff/add': 'Onboard a new employee to your organization.',
  '/settings':  'System settings, user roles, and platform permissions.',
  '/reports':   'Financial analytics, performance leaderboards, and aggregated invoices.',
};

export function Header({ onDrawerToggle, drawerWidth }: HeaderProps) {
  const { mode, toggleTheme } = useThemeStore();
  const location = useLocation();
  const getParentResource = (path: string) => {
    const segments = path.split('/');
    if (segments.length > 2) {
      return `/${segments[1]}`;
    }
    return path;
  };
  
  const basePath = getParentResource(location.pathname);
  const pageTitle = PAGE_TITLES[basePath] ?? PAGE_TITLES[location.pathname] ?? 'Kettan';
  const pageDesc = PAGE_DESCRIPTIONS[basePath] ?? PAGE_DESCRIPTIONS[location.pathname] ?? 'Kettan · Café Chain Operations';

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
        borderBottom: '1px solid #E5E7EB',
        color: 'text.primary',
        transition: 'margin-left 220ms cubic-bezier(0.4,0,0.2,1), width 220ms cubic-bezier(0.4,0,0.2,1)',
        '.dark &': {
          background: 'rgba(46, 31, 20, 0.85)',
          color: '#E8D3A9',
          borderBottomColor: 'rgba(201,168,77,0.15)',
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

          <Box>
            <Typography
              sx={{
                fontSize: 17,
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
                color: '#8C6B43',
                letterSpacing: '0.01em',
                '.dark &': { color: 'rgba(201,168,77,0.55)' },
              }}
            >
              {pageDesc}
            </Typography>
          </Box>
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          {/* Search bar */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              background: 'rgba(74,52,24,0.07)',
              border: '1px solid rgba(201,168,77,0.2)',
              borderRadius: '8px',
              px: 1.5,
              py: 0.6,
              mr: 0.5,
              '.dark &': {
                background: 'rgba(201,168,77,0.07)',
                borderColor: 'rgba(201,168,77,0.12)',
              },
              '&:focus-within': {
                borderColor: '#C9A84C',
                background: 'rgba(201,168,77,0.1)',
              },
              transition: 'border-color 160ms, background 160ms',
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 16, color: '#8C6B43', flexShrink: 0 }} />
            <InputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                fontSize: 13,
                color: '#2E1F0C',
                width: 160,
                '.dark &': { color: '#E8D3A9' },
                '& ::placeholder': { color: '#B08B5A', opacity: 1 },
              }}
            />
          </Box>

          {/* Notifications */}
          <NotificationBell />

          {/* Theme toggle */}
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                color: '#8C6B43',
                '&:hover': { background: 'rgba(201,168,77,0.1)', color: '#6B4C2A' },
                transition: 'background 160ms, color 160ms',
              }}
            >
              {mode === 'dark'
                ? <LightModeRoundedIcon sx={{ fontSize: 19 }} />
                : <DarkModeRoundedIcon  sx={{ fontSize: 19 }} />
              }
            </IconButton>
          </Tooltip>

          {/* Divider */}
          <Box sx={{ width: 1, height: 24, background: 'rgba(201,168,77,0.2)', mx: 0.5 }} />

          {/* Avatar */}
          <Tooltip title="Super Admin">
            <IconButton sx={{ p: 0.3 }}>
              <Avatar
                alt="Super Admin"
                src=""
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6B4C2A 0%, #C9A84C 100%)',
                  color: '#FAF5EF',
                  border: '2px solid rgba(201,168,77,0.3)',
                }}
              >
                SA
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
