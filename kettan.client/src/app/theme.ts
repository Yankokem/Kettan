import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Brand palette reference: browns #6B4C2A→#C9A87D, sage #546B3F→#93AF7E, gold #C9A84C

const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, letterSpacing: '0.06em' },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: '0.01em',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': { fontWeight: 600 },
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'light',
    primary: {
      main:  '#6B4C2A',
      light: '#8C6B43',
      dark:  '#4A3418',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main:  '#546B3F',
      light: '#718F58',
      dark:  '#3D5029',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',   // clean neutral light gray
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#111827',  // near-black — clean neutral
      secondary: '#6B7280',  // cool gray
    },
    divider: '#E5E7EB',
    error:   { main: '#DC2626' },
    warning: { main: '#D97706' },
    info:    { main: '#3B82F6' },
    success: { main: '#16A34A' },
  },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary: {
      main:  '#C9A87D',
      light: '#DEC9A8',
      dark:  '#8C6B43',
      contrastText: '#160E04',
    },
    secondary: {
      main:  '#93AF7E',
      light: '#B9CBAA',
      dark:  '#546B3F',
      contrastText: '#0B0F04',
    },
    background: {
      default: '#161311',
      paper:   '#1F1B18',
    },
    text: {
      primary:   '#F5F2ED',
      secondary: '#A39C93',
    },
    divider: '#36312D',
    error:   { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    info:    { main: '#60A5FA' },
    success: { main: '#4ADE80' },
  },
});
