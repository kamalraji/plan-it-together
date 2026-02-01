import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useAuthSessionRefresh
 *
 * Hook that keeps the Supabase session fresh by periodically refreshing the token.
 * Listens for auth state changes and triggers logout callback when session expires.
 *
 * Uses native Supabase auth methods instead of legacy REST API calls.
 */
export function useAuthSessionRefresh(onLogout: () => void, refreshIntervalMs = 10 * 60 * 1000) {
  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const refreshSession = async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Session refresh failed:', error.message);
          // If refresh fails due to invalid session, trigger logout
          if (error.message.includes('Invalid') || error.message.includes('expired')) {
            onLogout();
          }
        }
      } catch (_error) {
        // Silent failure - Supabase handles session state internally
      }
    };

    // Initial refresh once the hook mounts to extend any existing session
    void refreshSession();

    if (refreshIntervalMs > 0) {
      intervalId = window.setInterval(() => {
        if (!isMounted) return;
        void refreshSession();
      }, refreshIntervalMs);
    }

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          onLogout();
        }
      }
    });

    // Also listen for global auth:logout events (from api.ts 401 responses)
    const handleLogout = () => {
      onLogout();
    };

    window.addEventListener('auth:logout' as any, handleLogout);

    return () => {
      isMounted = false;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      subscription.unsubscribe();
      window.removeEventListener('auth:logout' as any, handleLogout);
    };
  }, [onLogout, refreshIntervalMs]);
}
