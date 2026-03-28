import { AppBar, IconButton, Toolbar, Box, Avatar, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeStore } from '../../store/useThemeStore';

interface HeaderProps {
  onDrawerToggle: () => void;
  drawerWidth: number;
}

export function Header({ onDrawerToggle, drawerWidth }: HeaderProps) {
  const { mode, toggleTheme } = useThemeStore();
  
  return (
    <AppBar
      position="fixed"
      elevation={0}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white transition-colors"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar className="h-16 px-4 sm:px-6 flex justify-between">
        <Box className="flex items-center">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Box className="flex items-center gap-3">
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleTheme} className="text-gray-600 dark:text-gray-300">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Box className="w-px h-6 bg-gray-300 dark:bg-slate-700 mx-1" />
          
          <Tooltip title="Profile">
             <IconButton className="p-0.5">
                <Avatar alt="Super Admin" src="" className="w-8 h-8 bg-primary-main" />
             </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
