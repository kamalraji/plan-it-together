/**
 * Section Error Boundary
 * Isolates crashes within form sections and chart components
 * Provides graceful degradation with retry functionality
 */
import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
  className?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.sectionName}:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            'rounded-lg border border-destructive/30 bg-destructive/5 p-4',
            this.props.className
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-destructive">
                {this.props.sectionName} failed to load
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Chart Error Boundary - specialized for analytics charts
 */
export class ChartErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Chart error in ${this.props.sectionName}:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center',
            this.props.className
          )}
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">
            Unable to render {this.props.sectionName}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleRetry}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
