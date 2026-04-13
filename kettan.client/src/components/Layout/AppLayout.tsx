import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet, useLocation } from '@tanstack/react-router';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { Header } from './Header';
import { PageTransitionWrapper } from './PageTransitionWrapper';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const effectiveWidth = collapsed ? 64 : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Header onDrawerToggle={handleDrawerToggle} drawerWidth={effectiveWidth} />

      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed(!collapsed)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: 0,
          width: { sm: `calc(100% - ${effectiveWidth}px)` },
          transition: 'width 220ms cubic-bezier(0.4,0,0.2,1), margin 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <Toolbar sx={{ height: 64, minHeight: 64, flexShrink: 0 }} />
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            overflowY: 'auto',
          }}
        >
          <PageTransitionWrapper routeKey={location.pathname}>
            <Outlet />
          </PageTransitionWrapper>
        </Box>
      </Box>
    </Box>
  );
}
