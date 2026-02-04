import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { PageLoading, SkeletonDashboard, SkeletonTable } from './LoadingStates';
import { RetryableErrorBoundary } from './LazyLoadingUtils';

// Route-based code splitting configuration
export interface RouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
  fallback?: ComponentType;
  preload?: boolean;
  errorBoundary?: boolean;
}

// Create lazy route component with optimized loading
export const createLazyRoute = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: ComponentType;
    preload?: boolean;
    errorBoundary?: boolean;
    chunkName?: string;
  } = {}
): LazyExoticComponent<ComponentType<P>> => {
  const LazyComponent = React.lazy(importFn);

  // Preload the component if requested
  if (options.preload && typeof window !== 'undefined') {
    // Use requestIdleCallback if available for better performance
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(() => { /* Preload failed silently */ });
      });
    } else {
      setTimeout(() => {
        importFn().catch(() => { /* Preload failed silently */ });
      }, 100);
    }
  }

  return LazyComponent;
};

// Route wrapper with suspense and error boundary
export const RouteWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: ComponentType;
  errorBoundary?: boolean;
  loadingType?: 'page' | 'dashboard' | 'table';
}> = ({ 
  children, 
  fallback, 
  errorBoundary = true, 
  loadingType = 'page' 
}) => {
  const getFallbackComponent = () => {
    if (fallback) return fallback;
    
    switch (loadingType) {
      case 'dashboard':
        return SkeletonDashboard;
      case 'table':
        return () => <SkeletonTable rows={5} columns={4} />;
      default:
        return PageLoading;
    }
  };

  const FallbackComponent = getFallbackComponent();

  const content = (
    <Suspense fallback={<FallbackComponent />}>
      {children}
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <RetryableErrorBoundary maxRetries={3}>
        {content}
      </RetryableErrorBoundary>
    );
  }

  return content;
};

// Preload routes based on user interaction patterns
export const preloadRoutes = (routes: string[]) => {
  if (typeof window === 'undefined') return;

  routes.forEach(route => {
    // This would be replaced with actual route imports in implementation
    import(/* webpackChunkName: "[request]" */ `@/pages/${route}.tsx`)
      .catch(() => {
        // Route preload failed - will load on demand
      });
  });
};

// Route preloading based on user behavior
export const useRoutePreloading = () => {
  const preloadedRoutes = React.useRef<Set<string>>(new Set());

  const preloadRoute = React.useCallback((routePath: string) => {
    if (preloadedRoutes.current.has(routePath)) return;
    
    preloadedRoutes.current.add(routePath);
    
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        preloadRoutes([routePath]);
      });
    } else {
      setTimeout(() => {
        preloadRoutes([routePath]);
      }, 100);
    }
  }, []);

  const preloadOnHover = React.useCallback((routePath: string) => {
    return {
      onMouseEnter: () => preloadRoute(routePath),
      onFocus: () => preloadRoute(routePath),
    };
  }, [preloadRoute]);

  return { preloadRoute, preloadOnHover };
};

// Bundle analyzer helper (development only)
export const BundleAnalyzer: React.FC = () => {
  const [bundleInfo, setBundleInfo] = React.useState<{
    chunks: number;
    totalSize: number;
    loadedChunks: string[];
  } | null>(null);

  React.useEffect(() => {
    // Only run in development
    if (typeof window === 'undefined' || window.location.hostname !== 'localhost') {
      return;
    }

    // Mock bundle analysis - in real implementation this would use webpack stats
    const mockBundleInfo = {
      chunks: 12,
      totalSize: 2.4 * 1024 * 1024, // 2.4MB
      loadedChunks: ['main', 'vendor', 'dashboard', 'events']
    };

    setBundleInfo(mockBundleInfo);
  }, []);

  if (!bundleInfo || typeof window === 'undefined' || window.location.hostname !== 'localhost') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-foreground/80 text-white p-3 rounded-md text-xs max-w-xs">
      <div className="font-semibold mb-2">Bundle Info</div>
      <div className="space-y-1">
        <div>Chunks: {bundleInfo.chunks}</div>
        <div>Size: {(bundleInfo.totalSize / 1024 / 1024).toFixed(2)}MB</div>
        <div>Loaded: {bundleInfo.loadedChunks.join(', ')}</div>
      </div>
    </div>
  );
};

// Network-aware code splitting
export const useNetworkAwareLoading = () => {
  const [connectionType, setConnectionType] = React.useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return;
    }

    const connection = (navigator as any).connection;
    
    const updateConnectionInfo = () => {
      setConnectionType(connection.effectiveType || 'unknown');
      setIsSlowConnection(
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.downlink < 1
      );
    };

    updateConnectionInfo();
    connection.addEventListener('change', updateConnectionInfo);

    return () => {
      connection.removeEventListener('change', updateConnectionInfo);
    };
  }, []);

  return { connectionType, isSlowConnection };
};

// Adaptive loading based on device capabilities
export const useAdaptiveLoading = () => {
  const [deviceCapabilities, setDeviceCapabilities] = React.useState({
    memory: 4, // GB
    cores: 4,
    isLowEnd: false
  });

  React.useEffect(() => {
    if (typeof navigator === 'undefined') return;

    // Check device memory if available
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isLowEnd = memory <= 2 || cores <= 2;

    setDeviceCapabilities({ memory, cores, isLowEnd });
  }, []);

  const getOptimalChunkSize = React.useCallback(() => {
    return deviceCapabilities.isLowEnd ? 10 : 25;
  }, [deviceCapabilities.isLowEnd]);

  const shouldUseVirtualization = React.useCallback((itemCount: number) => {
    return deviceCapabilities.isLowEnd ? itemCount > 50 : itemCount > 100;
  }, [deviceCapabilities.isLowEnd]);

  return {
    deviceCapabilities,
    getOptimalChunkSize,
    shouldUseVirtualization
  };
};

// Route-based performance monitoring
export const useRoutePerformance = (routeName: string) => {
  const [metrics, setMetrics] = React.useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
  });

  React.useEffect(() => {
    const startTime = performance.now();

    // Measure initial render time
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measureRenderTime);

    // Measure time to interactive
    const measureInteractionTime = () => {
      const interactionTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, interactionTime }));
    };

    // Measure after a short delay to allow for hydration
    setTimeout(measureInteractionTime, 100);

    // Performance metrics are collected silently for internal use
  }, [routeName]);

  return metrics;
};

export default {
  createLazyRoute,
  RouteWrapper,
  preloadRoutes,
  useRoutePreloading,
  BundleAnalyzer,
  useNetworkAwareLoading,
  useAdaptiveLoading,
  useRoutePerformance
};