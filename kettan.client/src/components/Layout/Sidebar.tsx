import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Collapse,
} from '@mui/material';
import logo from '../../assets/logo.png';
import icon from '../../assets/icon.png';
import DashboardRoundedIcon         from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon        from '@mui/icons-material/Inventory2Rounded';
import StoreRoundedIcon             from '@mui/icons-material/StoreRounded';

import AssignmentReturnRoundedIcon  from '@mui/icons-material/AssignmentReturnRounded';
import CategoryRoundedIcon          from '@mui/icons-material/CategoryRounded';
import BarChartRoundedIcon          from '@mui/icons-material/BarChartRounded';
import BadgeRoundedIcon             from '@mui/icons-material/BadgeRounded';
import ExpandMoreRoundedIcon        from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon        from '@mui/icons-material/ExpandLessRounded';

import ShoppingCartRoundedIcon      from '@mui/icons-material/ShoppingCartRounded';
import ScaleRoundedIcon             from '@mui/icons-material/ScaleRounded';
import AnalyticsRoundedIcon         from '@mui/icons-material/AnalyticsRounded';
import LocalCafeRoundedIcon         from '@mui/icons-material/LocalCafeRounded';
import FeedRoundedIcon              from '@mui/icons-material/FeedRounded';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { IconButton } from '@mui/material';
import { canAccessModule } from '../../utils/roleHelpers';

const DRAWER_WIDTH = 268;

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  module?: string;
}

const MAIN_NAV: NavItem[] = [
  { text: 'Dashboard',          icon: <DashboardRoundedIcon />,          path: '/', module: 'dashboard' },
  { text: 'Supply Requests',    icon: <ShoppingCartRoundedIcon />,       path: '/supply-requests', module: 'supply-requests' },
  { text: 'Order Processing',   icon: <CategoryRoundedIcon />,            path: '/orders', module: 'order-processing' },
  { text: 'Returns',            icon: <AssignmentReturnRoundedIcon />,    path: '/returns', module: 'returns' },
  { text: 'Branches',           icon: <StoreRoundedIcon />,            path: '/branches', module: 'branches' },
  { text: 'Company Profile',    icon: <StoreRoundedIcon />,            path: '/company-profile', module: 'company-profile' },
  { text: 'Branch Profile',     icon: <StoreRoundedIcon />,            path: '/branch-profile', module: 'branch-profile' },
  { text: 'Inventory',          icon: <Inventory2RoundedIcon />,       path: '/hq-inventory', module: 'hq-inventory' },
  { text: 'Menu & Recipes',     icon: <LocalCafeRoundedIcon />,        path: '/menu', module: 'menu' },
  { text: 'Consumption',        icon: <ScaleRoundedIcon />,            path: '/consumption', module: 'consumption' },
  { text: 'Staff Directory',    icon: <BadgeRoundedIcon />,            path: '/staff', module: 'staff' },
  { text: 'Audit Logs',         icon: <FeedRoundedIcon />,               path: '/audit-logs', module: 'audit-logs' },
  { text: 'Finance & Reports',  icon: <BarChartRoundedIcon />,         path: '/reports', module: 'reports' },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { text: 'Dashboard',          icon: <DashboardRoundedIcon />,          path: '/' },
  { text: 'Tenant Management',  icon: <StoreRoundedIcon />,              path: '/tenants' },
  { text: 'Platform Analytics', icon: <AnalyticsRoundedIcon />,          path: '/analytics' },
  { text: 'Help & Support',    icon: <BadgeRoundedIcon />,               path: '/help' },
];

function NavLink({
  item,
  currentPath,
  collapsed,
  onClick,
}: {
  item: NavItem;
  currentPath: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = item.path ? currentPath === item.path : false;
  const hasChildren = item.children && item.children.length > 0;

  const content = (
    <ListItemButton
      selected={isActive}
      onClick={hasChildren ? () => setOpen(!open) : undefined}
      sx={{
        mx: 1,
        mb: 0.25,
        borderRadius: '8px',
        py: 0.9,
        px: collapsed ? 1.25 : 1.5,
        minHeight: 40,
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        '&::before': isActive ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: '3px',
          borderRadius: '0 4px 4px 0',
          background: '#C9A84C',
        } : {},
        backgroundColor: isActive
          ? 'rgba(201,168,77,0.14) !important'
          : 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(201,168,77,0.09) !important',
        },
        transition: 'background 160ms, padding 200ms',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 0 : 36,
          mr: collapsed ? 0 : 1,
          color: isActive ? 'primary.main' : 'text.secondary',
          transition: 'color 160ms',
          '& svg': { fontSize: 20 },
        }}
      >
        {item.icon}
      </ListItemIcon>

      {!collapsed && (
        <>
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'primary.main' : 'text.primary',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          />
          {hasChildren && (open
            ? <ExpandLessRoundedIcon sx={{ fontSize: 16, color: 'text.disabled', ml: 0.5 }} />
            : <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'text.disabled', ml: 0.5 }} />
          )}
        </>
      )}
    </ListItemButton>
  );

  const wrapped = item.path ? (
    <Box onClick={(e) => e.stopPropagation()}>
      <Link to={item.path} className="w-full no-underline" onClick={onClick}>
        {content}
      </Link>
    </Box>
  ) : (
    <Box onClick={(e) => e.stopPropagation()}>
      {content}
    </Box>
  );

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      {collapsed
        ? <Tooltip title={item.text} placement="right">{wrapped as React.ReactElement}</Tooltip>
        : wrapped
      }
      {hasChildren && !collapsed && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 2 }}>
            {item.children!.map((child) => (
              <NavLink key={child.text} item={child} currentPath={currentPath} collapsed={false} onClick={onClick} />
            ))}
          </List>
        </Collapse>
      )}
    </ListItem>
  );
}

export function Sidebar({ mobileOpen, onDrawerToggle, collapsed, onCollapseToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();



  // Filter menu items using canAccessModule() from roleHelpers
  const navFilter = (item: NavItem) => {
    // SuperAdmin items don't have module property, allow all
    if (!item.module) return true;
    // Use canAccessModule() for permission checking
    return user?.role ? canAccessModule(user.role, item.module) : false;
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const navItems = isSuperAdmin
    ? SUPER_ADMIN_NAV
    : MAIN_NAV.filter(navFilter).map(item => {
        if (item.module === 'hq-inventory' && user?.branchId) {
          return { ...item, text: 'My Branch Inventory' };
        }
        return item;
      });

  const drawerContent = (
    <Box
      className="sidebar-bg"
      onClick={onCollapseToggle}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: collapsed ? 64 : DRAWER_WIDTH,
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        overflowX: 'hidden',
        overflowY: 'auto',
        cursor: 'pointer',
      }}
    >
      {/* ── Logo ── */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: collapsed ? 1.5 : 2,
          userSelect: 'none',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onCollapseToggle();
        }}
      >
        {collapsed ? (
          <img 
            src={icon} 
            alt="Kettan Icon" 
            style={{ height: 36, width: 36, flexShrink: 0, borderRadius: 8 }} 
          />
        ) : (
          <img 
            src={logo} 
            alt="Kettan Logo" 
            style={{ height: 46, width: 'auto', flexShrink: 0 }} 
          />
        )}
      </Box>

      {/* ── Navigation ── */}
      <Box sx={{ flex: 1, pt: 2, pb: 2 }}>
        <List disablePadding>
          {navItems.map((item) => (
            <NavLink
              key={item.text}
              item={item}
              currentPath={location.pathname}
              collapsed={collapsed}
              onClick={onDrawerToggle}
            />
          ))}
        </List>
      </Box>

      {/* ── Footer (Company Info) ── */}
      {!collapsed && (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: '/company-profile' });
          }}
          sx={{
            px: 2,
            py: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'background 160ms',
            '&:hover': {
              background: 'rgba(201,168,77,0.08)',
            },
          }}
        >
          {user?.tenant?.logoUrl ? (
            <Box
              component="img"
              src={user.tenant.logoUrl}
              alt="Company Logo"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid rgba(201,168,77,0.2)',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6B4C2A, #C9A84C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(201,168,77,0.2)',
              }}
            >
              <StoreRoundedIcon sx={{ fontSize: 18, color: '#FAF5EF' }} />
            </Box>
          )}
          <Box 
            sx={{ 
              flex: 1, 
              overflow: 'hidden', 
              ml: 0.8,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pt: 0.2 // Slightly "lower" the whole block
            }}
          >
            <Typography 
              noWrap 
              sx={{ 
                fontSize: 13.5, 
                fontWeight: 700, 
                color: 'text.primary', 
                lineHeight: 1,
                letterSpacing: '-0.02em',
                display: 'block',
                mb: 0.2 // Minimal gap
              }}
            >
              {user?.tenant?.name || 'Kettan'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: 10.5, 
                color: 'text.secondary', 
                fontWeight: 600,
                letterSpacing: '0.02em',
                opacity: 0.8,
                lineHeight: 1
              }}
            >
              Company
            </Typography>
          </Box>
        </Box>
      )}
      {collapsed && (
        <Box 
          sx={{ 
            p: 1.5, 
            borderTop: 1, 
            borderColor: 'divider', 
            display: 'flex', 
            justifyContent: 'center',
          }}
        >
          <Tooltip title={user?.tenant?.name || 'Company'} placement="right">
            {user?.tenant?.logoUrl ? (
              <Box
                component="img"
                src={user.tenant.logoUrl}
                alt="Company Logo"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: '1px solid rgba(201,168,77,0.2)',
                }}
                onClick={() => navigate({ to: '/company-profile' })}
              />
            ) : (
              <IconButton 
                size="small" 
                onClick={() => navigate({ to: '/company-profile' })}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { background: 'rgba(201,168,77,0.15)' }
                }}
              >
                <StoreRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: collapsed ? 64 : DRAWER_WIDTH },
        flexShrink: { sm: 0 },
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            border: 'none',
            background: 'transparent',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? 64 : DRAWER_WIDTH,
            border: 'none',
            background: 'transparent',
            overflow: 'hidden',
            transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export { DRAWER_WIDTH };
