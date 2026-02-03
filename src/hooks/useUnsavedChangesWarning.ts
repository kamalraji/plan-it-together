import { useEffect, useCallback, useState } from 'react';

interface UseUnsavedChangesWarningOptions {
  isDirty: boolean;
  message?: string;
  enabled?: boolean;
}

/**
 * Hook to warn users before leaving a page with unsaved changes.
 * Handles browser navigation (refresh, close tab) via beforeunload.
 * 
 * Note: React Router navigation blocking (useBlocker) requires data router APIs
 * (createBrowserRouter + RouterProvider). Since we use BrowserRouter, this hook
 * only provides browser-level protection. For in-app navigation, use the
 * showManualDialog state and handle Cancel/Back buttons in the form component.
 */
export function useUnsavedChangesWarning({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  enabled = true,
}: UseUnsavedChangesWarningOptions) {
  const shouldBlock = isDirty && enabled;
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [pendingNavCallback, setPendingNavCallback] = useState<(() => void) | null>(null);

  // Handle browser navigation (refresh, close tab, back button)
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but we still need to set returnValue
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Request navigation (for use by Cancel/Back buttons)
  const requestNavigation = useCallback((callback: () => void) => {
    if (shouldBlock) {
      setPendingNavCallback(() => callback);
      setShowManualDialog(true);
    } else {
      callback();
    }
  }, [shouldBlock]);

  // Confirm navigation with user
  const confirmNavigation = useCallback(() => {
    setShowManualDialog(false);
    if (pendingNavCallback) {
      pendingNavCallback();
      setPendingNavCallback(null);
    }
  }, [pendingNavCallback]);

  // Cancel navigation
  const cancelNavigation = useCallback(() => {
    setShowManualDialog(false);
    setPendingNavCallback(null);
  }, []);

  return {
    isBlocked: showManualDialog,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
