import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_LOGOUT_MS = 2 * 60 * 1000; // Show warning 2 minutes before logout

interface UseAdminSessionTimeoutOptions {
  enabled?: boolean;
  onTimeout?: () => void;
}

export function useAdminSessionTimeout(options: UseAdminSessionTimeoutOptions = {}) {
  const { enabled = true, onTimeout } = options;
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    console.log('Admin session timeout - logging out');
    await supabase.auth.signOut();
    toast.error('Session expired due to inactivity', {
      description: 'Please log in again to continue.',
    });
    onTimeout?.();
    navigate('/login', { replace: true });
  }, [navigate, onTimeout]);

  const showWarning = useCallback(() => {
    toast.warning('Session expiring soon', {
      description: 'Your admin session will expire in 2 minutes due to inactivity.',
      duration: 10000,
    });
  }, []);

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!enabled) return;

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [enabled, handleLogout, showWarning]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    const handleActivity = () => {
      // Debounce activity checks to avoid excessive resets
      if (Date.now() - lastActivityRef.current > 1000) {
        resetTimeout();
      }
    };

    // Initial timeout setup
    resetTimeout();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [enabled, resetTimeout]);

  return { resetTimeout };
}
