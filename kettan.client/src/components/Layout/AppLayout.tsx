import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const DRAWER_WIDTH = 260;

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box className="flex min-h-screen bg-background-default dark:bg-slate-900 transition-colors">
      <Header onDrawerToggle={handleDrawerToggle} drawerWidth={DRAWER_WIDTH} />
      
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      <Box
        component="main"
        className="flex-grow flex flex-col min-w-0"
        sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}
      >
        <Toolbar className="h-16 shrink-0" /> {/* Spacer for the fixed header */}
        <Box className="flex-1 p-4 sm:p-8 overflow-auto">
          <Outlet /> {/* TanStack Router renders children here */}
        </Box>
      </Box>
    </Box>
  );
}
