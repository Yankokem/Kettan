
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { api } from '../../utils/api';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function SessionTimeout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useIdleTimer(IDLE_TIMEOUT_MS, async () => {
    if (isAuthenticated) {
      try {
        // Invalidate backend session cookie if applicable
        await api.post('/api/auth/logout');
      } catch (err) {
        // Ignored, we just want to clear frontend state anyway
      } finally {
        // Clear local frontend auth state
        logout();
        // Redirect to login page with a timeout reason
        navigate({ to: '/login', search: { reason: 'timeout' } as Record<string, unknown> });
      }
    }
  });

  return null; // Headless component
}
