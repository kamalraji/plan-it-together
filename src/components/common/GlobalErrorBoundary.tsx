import React, { Component, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api';
import { logging } from '@/lib/logging';

interface ErrorBoundaryInnerProps {
  children: ReactNode;
  onError?: (error: unknown, info?: React.ErrorInfo) => void;
}

interface ErrorBoundaryInnerState {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<ErrorBoundaryInnerProps, ErrorBoundaryInnerState> {
  override state: ErrorBoundaryInnerState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryInnerState {
    // Ensure a consistent fallback UI is shown after an error is thrown
    console.error('GlobalErrorBoundary getDerivedStateFromError:', error);
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the error for debugging and send it to any external handler
    console.error('GlobalErrorBoundary caught an error:', error, info);

    if (this.props.onError) {
      try {
        this.props.onError(error, info);
      } catch (handlerError) {
        console.error('Error in GlobalErrorBoundary onError handler:', handlerError);
      }
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card shadow-lg p-6 space-y-3 animate-in fade-in-50">
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              We hit an unexpected error while loading this view. You can try refreshing the page or coming back later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * GlobalErrorBoundary wrapper that safely uses hooks.
 * If hooks fail (e.g., AuthProvider not yet mounted), we still catch and log the error.
 */
export const GlobalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use try-catch pattern for hooks that might not be available during initial load
  let toast: ReturnType<typeof useToast>['toast'] | undefined;
  
  try {
    const toastContext = useToast();
    toast = toastContext.toast;
  } catch {
    // Toast not available, will fall back to console logging only
  }

  const handleError = useCallback(
    (error: unknown, info?: React.ErrorInfo) => {
      // Always log to console and logging service
      logging.captureError(error, {
        react_component_stack: info?.componentStack,
      });

      // Only show toast if available
      if (toast) {
        try {
          const message = handleApiError(error as any);
          toast({
            variant: 'destructive',
            title: 'Something went wrong',
            description: message,
          });
        } catch {
          // Toast failed, ignore
        }
      }
    },
    [toast],
  );

  return <ErrorBoundaryInner onError={handleError}>{children}</ErrorBoundaryInner>;
};