import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      gradients: {
        card: string;
      };
      status: {
        active: { bg: string; text: string };
        inactive: { bg: string; text: string };
        archived: { bg: string; text: string };
        success: string;
        danger: string;
        pending: string;
      };
      roles: Record<string, { bg: string; text: string }>;
      text: {
        charcoal: string;
      };
    };
  }
  interface ThemeOptions {
    custom?: {
      gradients?: {
        card?: string;
      };
      status?: {
        active?: { bg: string; text: string };
        inactive?: { bg: string; text: string };
        archived?: { bg: string; text: string };
        success?: string;
        danger?: string;
        pending?: string;
      };
      roles?: Record<string, { bg: string; text: string }>;
      text?: {
        charcoal?: string;
      };
    };
  }
}

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
  custom: {
    gradients: {
      card: 'linear-gradient(45deg, #FAF5EF 0%, #FFFFFF 100%)',
    },
    status: {
      active: { bg: '#E8F5E9', text: '#2E7D32' },
      inactive: { bg: '#F5F5F5', text: '#616161' },
      archived: { bg: '#FFEBEE', text: '#D32F2F' },
      success: '#2E7D32',
      danger: '#D32F2F',
      pending: '#ED6C02',
    },
    roles: {
      'TenantAdmin': { bg: '#FEF9C3', text: '#854D0E' },
      'HQ Manager': { bg: '#F0FDFA', text: '#0F766E' },
      'HqManager': { bg: '#F0FDFA', text: '#0F766E' },
      'Branch Owner': { bg: '#EEF2FF', text: '#4338CA' },
      'BranchOwner': { bg: '#EEF2FF', text: '#4338CA' },
      'Branch Manager': { bg: '#F0F9FF', text: '#0369A1' },
      'BranchManager': { bg: '#F0F9FF', text: '#0369A1' },
      'HQ Staff': { bg: '#FFFBEB', text: '#B45309' },
      'HqStaff': { bg: '#FFFBEB', text: '#B45309' },
      'HQ Executive': { bg: '#FFF1F2', text: '#BE123C' },
    },
    text: {
      charcoal: '#374151',
    },
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
  custom: {
    gradients: {
      card: 'linear-gradient(45deg, #1F1B18 0%, #2E2824 100%)',
    },
    status: {
      active: { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ADE80' },
      inactive: { bg: 'rgba(163, 156, 147, 0.1)', text: '#A39C93' },
      archived: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
      success: '#4ADE80',
      danger: '#EF4444',
      pending: '#F59E0B',
    },
    roles: {
      'TenantAdmin': { bg: 'rgba(234, 179, 8, 0.1)', text: '#FACC15' },
      'HQ Manager': { bg: 'rgba(20, 184, 166, 0.1)', text: '#2DD4BF' },
      'HqManager': { bg: 'rgba(20, 184, 166, 0.1)', text: '#2DD4BF' },
      'Branch Owner': { bg: 'rgba(99, 102, 241, 0.1)', text: '#818CF8' },
      'BranchOwner': { bg: 'rgba(99, 102, 241, 0.1)', text: '#818CF8' },
      'Branch Manager': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60A5FA' },
      'BranchManager': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60A5FA' },
      'HQ Staff': { bg: 'rgba(245, 158, 11, 0.1)', text: '#FBBF24' },
      'HqStaff': { bg: 'rgba(245, 158, 11, 0.1)', text: '#FBBF24' },
      'HQ Executive': { bg: 'rgba(244, 63, 94, 0.1)', text: '#FB7185' },
    },
    text: {
      charcoal: '#E5E7EB',
    },
  },
});
