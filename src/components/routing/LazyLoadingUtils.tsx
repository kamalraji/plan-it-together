import React, { Suspense, ComponentType, LazyExoticComponent, useState, useCallback, useEffect } from 'react';
import { PageLoading } from './LoadingStates';

// Enhanced error boundary with retry functionality
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

interface RetryableErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: ComponentType<{ error?: Error; retry: () => void; retryCount: number }>;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class RetryableErrorBoundary extends React.Component<
  RetryableErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: RetryableErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RetryableErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        retryCount: retryCount + 1,
      });
    }
  };

  override render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback: FallbackComponent, maxRetries = 3 } = this.props;

    if (hasError) {
      if (FallbackComponent) {
        return <FallbackComponent error={error} retry={this.retry} retryCount={retryCount} />;
      }

      return (
        <DefaultErrorFallback
          error={error}
          retry={this.retry}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{
  error?: Error;
  retry: () => void;
  retryCount: number;
  maxRetries: number;
}> = ({ error, retry, retryCount, maxRetries }) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 p-8">
      <div className="text-center">
        <div className="text-5xl mb-4 font-bold text-red-500">!</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>
        
        {retryCount > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Retry attempt: {retryCount} of {maxRetries}
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        {canRetry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus-visible:ring-ring focus:ring-offset-2"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-muted-foreground/40 text-white rounded-md hover:bg-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Reload Page
        </button>
      </div>

      {!canRetry && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Maximum retry attempts reached.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-indigo-600 hover:text-indigo-500 text-sm underline"
          >
            Go back to previous page
          </button>
        </div>
      )}
    </div>
  );
};

// Lazy loading wrapper with enhanced loading states
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: React.ComponentType;
    errorBoundary?: boolean;
    preload?: boolean;
  } = {}
): LazyExoticComponent<ComponentType<P>> => {
  const LazyComponent = React.lazy(importFn);

  // Preload the component if requested
  if (options.preload) {
    importFn().catch(console.error);
  }

  return LazyComponent;
};

// Suspense wrapper with custom loading component
export const SuspenseWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorBoundary?: boolean;
}> = ({ children, fallback: FallbackComponent = PageLoading, errorBoundary = true }) => {
  const content = (
    <Suspense fallback={<FallbackComponent />}>
      {children}
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <RetryableErrorBoundary>
        {content}
      </RetryableErrorBoundary>
    );
  }

  return content;
};

// Higher-order component for lazy loading with error boundaries
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  options: {
    fallback?: React.ComponentType;
    errorBoundary?: boolean;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <SuspenseWrapper
      fallback={options.fallback}
      errorBoundary={options.errorBoundary}
    >
      <Component {...props} />
    </SuspenseWrapper>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Preloader utility for critical routes
export const preloadRoute = (importFn: () => Promise<any>) => {
  // Only preload in browser environment
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(console.error);
      });
    } else {
      setTimeout(() => {
        importFn().catch(console.error);
      }, 100);
    }
  }
};

// Network-aware loading component
export const NetworkAwareLoading: React.FC<{
  children: React.ReactNode;
  slowNetworkFallback?: React.ComponentType;
}> = ({ children, slowNetworkFallback: SlowNetworkFallback }) => {
  const [isSlowNetwork, setIsSlowNetwork] = React.useState(false);

  React.useEffect(() => {
    // Check for slow network conditions
    const connection = (navigator as any).connection;
    if (connection) {
      const isSlowConnection = 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.downlink < 1;
      
      setIsSlowNetwork(isSlowConnection);
    }

    // Set a timeout to show slow network message
    const timer = setTimeout(() => {
      setIsSlowNetwork(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isSlowNetwork && SlowNetworkFallback) {
    return <SlowNetworkFallback />;
  }

  return <>{children}</>;
};

// Route-based code splitting utilities
export const createRouteBundle = (_routes: string[]) => {
  const bundleMap = new Map<string, Promise<any>>();

  const preloadBundle = (routePath: string) => {
    if (!bundleMap.has(routePath)) {
      // This would be replaced with actual dynamic imports in real implementation
      const importPromise = import(/* webpackChunkName: "[request]" */ `@/pages/${routePath}.tsx`);
      bundleMap.set(routePath, importPromise);
    }
    return bundleMap.get(routePath);
  };

  const getBundle = (routePath: string) => {
    return bundleMap.get(routePath);
  };

  return { preloadBundle, getBundle };
};

// Progressive loading component for large datasets
export const ProgressiveLoader: React.FC<{
  items: any[];
  batchSize?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  loadingComponent?: React.ComponentType;
  className?: string;
}> = ({ 
  items, 
  batchSize = 20, 
  renderItem, 
  loadingComponent: LoadingComponent = PageLoading,
  className = '' 
}) => {
  const [loadedCount, setLoadedCount] = useState(batchSize);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoading || loadedCount >= items.length) return;
    
    setIsLoading(true);
    
    // Simulate async loading delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setLoadedCount(prev => Math.min(prev + batchSize, items.length));
    setIsLoading(false);
  }, [isLoading, loadedCount, items.length, batchSize]);

  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (isIntersecting && !isLoading && loadedCount < items.length) {
      loadMore();
    }
  }, [isIntersecting, isLoading, loadedCount, items.length, loadMore]);

  const visibleItems = items.slice(0, loadedCount);

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
      
      {loadedCount < items.length && (
        <div ref={elementRef} className="py-4">
          {isLoading ? (
            <LoadingComponent />
          ) : (
            <button
              onClick={loadMore}
              className="w-full py-2 px-4 bg-muted hover:bg-muted rounded-md text-foreground transition-colors"
            >
              Load More ({items.length - loadedCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Import the useIntersectionObserver hook
const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
};

// Slow network fallback component
export const SlowNetworkFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    <div className="text-center">
      <p className="text-muted-foreground mb-2">Taking longer than usual...</p>
      <p className="text-sm text-muted-foreground">
        This might be due to a slow network connection.
      </p>
    </div>
  </div>
);