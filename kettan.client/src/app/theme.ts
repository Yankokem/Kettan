import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'light',
    primary: { main: '#3b82f6' }, // Taildwind blue-500 equivalent
    secondary: { main: '#f43f5e' }, // Tailwind rose-500 equivalent
    background: {
      default: '#f8fafc', // Tailwind slate-50
      paper: '#ffffff',
    },
  },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' }, // Taildwind blue-400 equivalent
    secondary: { main: '#fb7185' }, // Tailwind rose-400 equivalent
    background: {
      default: '#0f172a', // Tailwind slate-900 
      paper: '#1e293b', // Tailwind slate-800
    },
  },
});
