import { useEffect } from 'react';
import api from '@/lib/api';

/**
 * useAuthSessionRefresh
 *
 * Frontend-only hook that keeps the cookie-based session fresh and
 * redirects to /login when the backend signals that the session is no longer valid.
 *
 * - Periodically calls /api/auth/refresh-token using axios `withCredentials`.
 * - Listens for the global `auth:logout` event dispatched by api.ts on 401s
 *   and navigates to /login.
 *
 * NOTE: This hook does not touch tokens directly; it relies purely on
 * httpOnly cookies managed by the backend.
 */
export function useAuthSessionRefresh(onLogout: () => void, refreshIntervalMs = 10 * 60 * 1000) {
  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const refresh = async () => {
      try {
        await api.post('/auth/refresh-token');
      } catch (_error) {
        // If refresh fails, api.ts will surface 401s and emit auth:logout if applicable.
      }
    };

    // Initial refresh once the hook mounts to extend any existing session
    void refresh();

    if (refreshIntervalMs > 0) {
      intervalId = window.setInterval(() => {
        if (!isMounted) return;
        void refresh();
      }, refreshIntervalMs);
    }

    const handleLogout = () => {
      onLogout();
    };

    window.addEventListener('auth:logout' as any, handleLogout);

    return () => {
      isMounted = false;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener('auth:logout' as any, handleLogout);
    };
  }, [onLogout, refreshIntervalMs]);
}
