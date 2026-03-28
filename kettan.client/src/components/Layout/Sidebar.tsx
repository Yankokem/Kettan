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
import DashboardRoundedIcon         from '@mui/icons-material/DashboardRounded';
import LocalShippingRoundedIcon     from '@mui/icons-material/LocalShippingRounded';
import Inventory2RoundedIcon        from '@mui/icons-material/Inventory2Rounded';
import StoreRoundedIcon             from '@mui/icons-material/StoreRounded';
import PeopleRoundedIcon            from '@mui/icons-material/PeopleRounded';
import AssignmentReturnRoundedIcon  from '@mui/icons-material/AssignmentReturnRounded';
import TrackChangesRoundedIcon      from '@mui/icons-material/TrackChangesRounded';
import CategoryRoundedIcon          from '@mui/icons-material/CategoryRounded';
import BarChartRoundedIcon          from '@mui/icons-material/BarChartRounded';
import ManageAccountsRoundedIcon    from '@mui/icons-material/ManageAccountsRounded';
import BadgeRoundedIcon             from '@mui/icons-material/BadgeRounded';
import ExpandMoreRoundedIcon        from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon        from '@mui/icons-material/ExpandLessRounded';
import { Link, useLocation }        from '@tanstack/react-router';

const DRAWER_WIDTH = 268;

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  tag?: string;
  tagColor?: string;
}

const CORE_NAV: NavItem[] = [
  { text: 'Dashboard',          icon: <DashboardRoundedIcon />,          path: '/' },
  {
    text: 'Order Processing',   icon: <CategoryRoundedIcon />,            path: '/orders',
    tag: 'OFMS', tagColor: '#C9A84C',
  },
  {
    text: 'Picking & Packing',  icon: <Inventory2RoundedIcon />,          path: '/picking',
    tag: 'OFMS', tagColor: '#C9A84C',
  },
  {
    text: 'Shipping & Delivery',icon: <LocalShippingRoundedIcon />,       path: '/shipping',
    tag: 'OFMS', tagColor: '#C9A84C',
  },
  {
    text: 'Order Tracking',     icon: <TrackChangesRoundedIcon />,        path: '/tracking',
    tag: 'OFMS', tagColor: '#C9A84C',
  },
  {
    text: 'Returns',            icon: <AssignmentReturnRoundedIcon />,    path: '/returns',
    tag: 'OFMS', tagColor: '#C9A84C',
  },
];

const ADDITIONAL_NAV: NavItem[] = [
  { text: 'Tenants & Branches', icon: <StoreRoundedIcon />,            path: '/branches' },
  { text: 'Inventory',          icon: <Inventory2RoundedIcon />,       path: '/inventory' },
  { text: 'HR & Staff',         icon: <BadgeRoundedIcon />,            path: '/staff' },
  { text: 'User & Roles',       icon: <ManageAccountsRoundedIcon />,   path: '/users' },
  { text: 'Finance & Reports',  icon: <BarChartRoundedIcon />,         path: '/reports' },
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
          color: isActive ? '#C9A84C' : 'rgba(230,210,185,0.65)',
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
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#E8D3A9' : 'rgba(230,210,185,0.72)',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          />
          {item.tag && (
            <Typography
              component="span"
              sx={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.06em',
                px: 0.75,
                py: 0.1,
                borderRadius: '4px',
                border: `1px solid ${item.tagColor ?? '#C9A84C'}`,
                color: item.tagColor ?? '#C9A84C',
                ml: 1,
                opacity: 0.85,
              }}
            >
              {item.tag}
            </Typography>
          )}
          {hasChildren && (open
            ? <ExpandLessRoundedIcon sx={{ fontSize: 16, color: 'rgba(230,210,185,0.5)', ml: 0.5 }} />
            : <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'rgba(230,210,185,0.5)', ml: 0.5 }} />
          )}
        </>
      )}
    </ListItemButton>
  );

  const wrapped = item.path ? (
    <Link to={item.path} className="w-full no-underline" onClick={onClick}>
      {content}
    </Link>
  ) : content;

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

function SidebarSection({
  label,
  items,
  currentPath,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  currentPath: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Box sx={{ mb: 1 }}>
      {!collapsed && (
        <Typography
          variant="overline"
          sx={{
            px: 2.5,
            py: 0.5,
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'rgba(201,168,77,0.5)',
          }}
        >
          {label}
        </Typography>
      )}
      {collapsed && <Box sx={{ height: 8 }} />}
      <List disablePadding>
        {items.map((item) => (
          <NavLink
            key={item.text}
            item={item}
            currentPath={currentPath}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </List>
    </Box>
  );
}

export function Sidebar({ mobileOpen, onDrawerToggle }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const drawerContent = (
    <Box
      className="sidebar-bg"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: collapsed ? 64 : DRAWER_WIDTH,
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* ── Logo ── */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: collapsed ? 1.5 : 2.5,
          gap: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: '1px solid rgba(201,168,77,0.12)',
          flexShrink: 0,
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        {/* Coffee-bean icon mark */}
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #6B4C2A 0%, #C9A84C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(201,168,77,0.3)',
          }}
        >
          <Typography sx={{ fontSize: 18, lineHeight: 1, userSelect: 'none' }}>
            ☕
          </Typography>
        </Box>
        {!collapsed && (
          <Box>
            <Typography
              className="logo-shimmer"
              sx={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '0.12em',
                lineHeight: 1.1,
                textTransform: 'uppercase',
              }}
            >
              Kettan
            </Typography>
            <Typography
              sx={{
                fontSize: 9,
                color: 'rgba(201,168,77,0.55)',
                letterSpacing: '0.14em',
                fontWeight: 500,
                textTransform: 'uppercase',
                mt: 0.2,
              }}
            >
              Café Chain Ops
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Navigation ── */}
      <Box sx={{ flex: 1, pt: 2, pb: 2 }}>
        <SidebarSection
          label="Core Modules"
          items={CORE_NAV}
          currentPath={location.pathname}
          collapsed={collapsed}
          onNavigate={onDrawerToggle}
        />

        <Box sx={{ mx: 2, my: 1.5, borderTop: '1px solid rgba(201,168,77,0.10)' }} />

        <SidebarSection
          label="Additional"
          items={ADDITIONAL_NAV}
          currentPath={location.pathname}
          collapsed={collapsed}
          onNavigate={onDrawerToggle}
        />
      </Box>

      {/* ── Footer ── */}
      {!collapsed && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: '1px solid rgba(201,168,77,0.10)',
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
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#E8D3A9', lineHeight: 1.2 }}>
              Super Admin
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: 'rgba(201,168,77,0.55)', letterSpacing: '0.04em' }}>
              admin@kettan.ph
            </Typography>
          </Box>
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
