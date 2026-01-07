import React, { Component, ReactNode } from 'react';
import { logging } from '@/lib/logging';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * GlobalErrorBoundary - A simple, resilient error boundary that doesn't depend on any hooks or context.
 * This ensures it can catch errors even during early app initialization.
 */
export class GlobalErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('GlobalErrorBoundary getDerivedStateFromError:', error);
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, info);
    
    // Log to external service
    try {
      logging.captureError(error, {
        react_component_stack: info?.componentStack,
      });
    } catch {
      // Logging failed, ignore
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
