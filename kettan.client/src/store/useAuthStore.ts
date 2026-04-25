import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TenantSession {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  isActive: boolean;
  profileComplete: boolean;
  logoUrl?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  imageUrl?: string | null;
  tenant?: TenantSession | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string | null) => void;
  logout: () => void;
  updateTenant: (tenant: TenantSession) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token: token ?? null, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateTenant: (tenant) => set((state) => ({
        user: state.user ? { ...state.user, tenant: { ...state.user.tenant, ...tenant } } : null
      })),
      updateUser: (user) => set((state) => ({
        user: state.user ? { ...state.user, ...user } : null
      })),
    }),
    {
      name: 'kettan-auth-storage', // Persist auth session in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
