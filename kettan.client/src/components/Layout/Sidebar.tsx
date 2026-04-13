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
import DashboardRoundedIcon         from '@mui/icons-material/DashboardRounded';
import LocalShippingRoundedIcon     from '@mui/icons-material/LocalShippingRounded';
import Inventory2RoundedIcon        from '@mui/icons-material/Inventory2Rounded';
import StoreRoundedIcon             from '@mui/icons-material/StoreRounded';
import PeopleRoundedIcon            from '@mui/icons-material/PeopleRounded';
import AssignmentReturnRoundedIcon  from '@mui/icons-material/AssignmentReturnRounded';
import CategoryRoundedIcon          from '@mui/icons-material/CategoryRounded';
import BarChartRoundedIcon          from '@mui/icons-material/BarChartRounded';
import ManageAccountsRoundedIcon    from '@mui/icons-material/ManageAccountsRounded';
import BadgeRoundedIcon             from '@mui/icons-material/BadgeRounded';
import ExpandMoreRoundedIcon        from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon        from '@mui/icons-material/ExpandLessRounded';
import LogoutRoundedIcon            from '@mui/icons-material/LogoutRounded';
import ShoppingCartRoundedIcon      from '@mui/icons-material/ShoppingCartRounded';
import ScaleRoundedIcon             from '@mui/icons-material/ScaleRounded';
import AnalyticsRoundedIcon         from '@mui/icons-material/AnalyticsRounded';
import LocalCafeRoundedIcon         from '@mui/icons-material/LocalCafeRounded';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { IconButton } from '@mui/material';

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
  allowedRoles?: string[];
}

const MAIN_NAV: NavItem[] = [
  { text: 'Dashboard',          icon: <DashboardRoundedIcon />,          path: '/', allowedRoles: ['SuperAdmin', 'TenantAdmin', 'HqManager', 'HqStaff', 'BranchManager', 'BranchOwner'] },
  { text: 'Supply Requests',    icon: <ShoppingCartRoundedIcon />,       path: '/supply-requests', allowedRoles: ['BranchManager', 'BranchOwner'] },
  { text: 'Order Processing',   icon: <CategoryRoundedIcon />,            path: '/orders', allowedRoles: ['HqManager', 'HqStaff', 'TenantAdmin'] },
  { text: 'Picking & Packing',  icon: <Inventory2RoundedIcon />,          path: '/picking', allowedRoles: ['HqManager', 'HqStaff'] },
  { text: 'Shipping & Delivery',icon: <LocalShippingRoundedIcon />,       path: '/shipping', allowedRoles: ['HqManager', 'HqStaff'] },
  { text: 'Returns',            icon: <AssignmentReturnRoundedIcon />,    path: '/returns', allowedRoles: ['BranchManager', 'HqStaff', 'HqManager'] },
  { text: 'Branch and Inventory', icon: <StoreRoundedIcon />,            path: '/branches', allowedRoles: ['SuperAdmin', 'TenantAdmin', 'BranchManager', 'BranchOwner'] },
  { text: 'Company Profile',    icon: <StoreRoundedIcon />,            path: '/company-profile', allowedRoles: ['SuperAdmin', 'TenantAdmin'] },
  { text: 'HQ Inventory',       icon: <Inventory2RoundedIcon />,       path: '/hq-inventory', allowedRoles: ['HqManager', 'HqStaff', 'TenantAdmin'] },
  { text: 'Menu & Recipes',     icon: <LocalCafeRoundedIcon />,        path: '/menu', allowedRoles: ['HqManager', 'TenantAdmin', 'HqStaff'] },
  { text: 'Consumption',        icon: <ScaleRoundedIcon />,            path: '/consumption', allowedRoles: ['BranchManager', 'BranchOwner'] },
  { text: 'Staff Directory',    icon: <BadgeRoundedIcon />,            path: '/staff', allowedRoles: ['TenantAdmin', 'HqManager', 'BranchManager'] },
  { text: 'Settings',           icon: <ManageAccountsRoundedIcon />,   path: '/settings', allowedRoles: ['SuperAdmin', 'TenantAdmin'] },
  { text: 'Finance & Reports',  icon: <BarChartRoundedIcon />,         path: '/reports', allowedRoles: ['TenantAdmin', 'BranchOwner', 'HqManager'] },
  { text: 'Platform Analytics', icon: <AnalyticsRoundedIcon />,        path: '/analytics', allowedRoles: ['SuperAdmin'] },
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
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const navFilter = (item: NavItem) => !item.allowedRoles || (user?.role && item.allowedRoles.includes(user.role));

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
            src="/icon.svg" 
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
          {MAIN_NAV.filter(navFilter).map((item) => (
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

      {/* ── Footer ── */}
      {!collapsed && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B4C2A, #C9A84C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PeopleRoundedIcon sx={{ fontSize: 15, color: '#FAF5EF' }} />
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
              {user?.name || 'Super Admin'}
            </Typography>
            <Typography noWrap sx={{ fontSize: 10.5, color: 'text.disabled', letterSpacing: '0.04em' }}>
              {user?.role || 'admin'}
            </Typography>
          </Box>
          <Tooltip title="Logout" placement="top">
            <IconButton onClick={(e) => { e.stopPropagation(); handleLogout(); }} size="small" sx={{ color: 'text.secondary', cursor: 'pointer' }}>
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {collapsed && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
          <Tooltip title="Logout" placement="right">
            <IconButton onClick={(e) => { e.stopPropagation(); handleLogout(); }} size="small" sx={{ color: 'text.secondary', cursor: 'pointer' }}>
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
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
