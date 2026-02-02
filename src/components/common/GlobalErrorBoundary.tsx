import React, { Component, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api';
import { logging } from '@/lib/logging';
import { useAuth } from '@/hooks/useAuth';

interface ErrorBoundaryInnerProps {
  children: ReactNode;
  onError?: (error: unknown, info?: React.ErrorInfo) => void;
}

interface ErrorBoundaryInnerState {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<ErrorBoundaryInnerProps, ErrorBoundaryInnerState> {
  override state: ErrorBoundaryInnerState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryInnerState {
    // Ensure a consistent fallback UI is shown after an error is thrown
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send to external handler (Sentry via logging service)
    if (this.props.onError) {
      try {
        this.props.onError(error, info);
      } catch {
        // Silently fail if handler throws
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

export const GlobalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { user, session } = useAuth();

  const handleError = useCallback(
    (error: unknown, info?: React.ErrorInfo) => {
      logging.captureError(error, {
        react_component_stack: info?.componentStack,
        user_id: user?.id,
        user_role: user?.role,
        session_expires_at: session?.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : undefined,
      });

      const message = handleApiError(error as any);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: message,
      });
    },
    [toast, user, session],
  );

  return <ErrorBoundaryInner onError={handleError}>{children}</ErrorBoundaryInner>;
};
