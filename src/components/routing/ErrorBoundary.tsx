import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.props.onReset?.();
    this.setState(prev => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, retryCount } = this.state;
      const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module');
      const maxRetries = 3;
      const canRetry = retryCount < maxRetries;

      return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-lg">
            <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              {/* Error Message */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {isChunkError ? 'Update Available' : 'Something went wrong'}
                </h1>
                <p className="text-muted-foreground">
                  {isChunkError
                    ? 'A new version is available. Please refresh to get the latest updates.'
                    : 'We encountered an unexpected error. This has been logged and we\'ll look into it.'}
                </p>
                {retryCount > 0 && canRetry && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-4 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-64">
                    <div className="mb-3">
                      <span className="font-semibold text-foreground">Error:</span>
                      <span className="text-destructive ml-2">{error.message}</span>
                    </div>
                    {error.stack && (
                      <div className="mb-3">
                        <span className="font-semibold text-foreground">Stack:</span>
                        <pre className="whitespace-pre-wrap mt-1 text-muted-foreground">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <span className="font-semibold text-foreground">Component Stack:</span>
                        <pre className="whitespace-pre-wrap mt-1 text-muted-foreground">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;