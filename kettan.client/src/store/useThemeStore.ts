import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      toggleTheme: () => set((state) => ({
        mode: state.mode === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'kettan-theme-storage', // Key for localStorage
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
