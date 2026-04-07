import { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useThemeStore } from '../store/useThemeStore';
import { lightTheme, darkTheme } from './theme';
import { ToastProvider } from '../components/UI/ToastProvider';

export function AppProvider({ children }: { children: React.ReactNode }) {      
  const themeMode = useThemeStore((state) => state.mode);

  const appliedTheme = useMemo(() => {
    let mode = themeMode;
    if (mode === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = prefersDark ? 'dark' : 'light';
    }

    // Toggle Tailwind dark class on HTML root natively so our tailwind dark: classes work seamlessly too
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return mode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode]);

  return (
    <ThemeProvider theme={appliedTheme}>
      <CssBaseline />
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
