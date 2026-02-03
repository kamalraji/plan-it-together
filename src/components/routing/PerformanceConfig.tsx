import React from 'react';
import { useNetworkAwareLoading, useAdaptiveLoading } from './CodeSplitting';

// Global performance configuration
export interface PerformanceConfig {
  // Loading states
  loadingStates: {
    enableSkeletonScreens: boolean;
    enableProgressBars: boolean;
    enableLoadingSpinners: boolean;
    defaultTimeout: number;
  };
  
  // Code splitting
  codeSplitting: {
    enableLazyLoading: boolean;
    preloadCriticalRoutes: boolean;
    chunkSizeThreshold: number;
  };
  
  // Virtualization
  virtualization: {
    enableVirtualScrolling: boolean;
    itemHeightThreshold: number;
    containerHeightThreshold: number;
  };
  
  // Pagination
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
    enablePrefetching: boolean;
  };
  
  // Error handling
  errorHandling: {
    maxRetries: number;
    retryDelay: number;
    enableErrorBoundaries: boolean;
  };
  
  // Performance monitoring
  monitoring: {
    enableMetrics: boolean;
    enableBundleAnalysis: boolean;
    logPerformanceWarnings: boolean;
  };
}

// Default performance configuration
export const defaultPerformanceConfig: PerformanceConfig = {
  loadingStates: {
    enableSkeletonScreens: true,
    enableProgressBars: true,
    enableLoadingSpinners: true,
    defaultTimeout: 30000, // 30 seconds
  },
  
  codeSplitting: {
    enableLazyLoading: true,
    preloadCriticalRoutes: true,
    chunkSizeThreshold: 250000, // 250KB
  },
  
  virtualization: {
    enableVirtualScrolling: true,
    itemHeightThreshold: 100, // Enable for lists with items > 100
    containerHeightThreshold: 400, // Enable for containers > 400px
  },
  
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    enablePrefetching: true,
  },
  
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    enableErrorBoundaries: true,
  },
  
  monitoring: {
    enableMetrics: true,
    enableBundleAnalysis: typeof window !== 'undefined' && window.location.hostname === 'localhost',
    logPerformanceWarnings: true,
  },
};

// Performance context
const PerformanceContext = React.createContext<PerformanceConfig>(defaultPerformanceConfig);

// Performance provider component
export const PerformanceProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<PerformanceConfig>;
}> = ({ children, config = {} }) => {
  const mergedConfig = React.useMemo(() => ({
    ...defaultPerformanceConfig,
    ...config,
    loadingStates: { ...defaultPerformanceConfig.loadingStates, ...config.loadingStates },
    codeSplitting: { ...defaultPerformanceConfig.codeSplitting, ...config.codeSplitting },
    virtualization: { ...defaultPerformanceConfig.virtualization, ...config.virtualization },
    pagination: { ...defaultPerformanceConfig.pagination, ...config.pagination },
    errorHandling: { ...defaultPerformanceConfig.errorHandling, ...config.errorHandling },
    monitoring: { ...defaultPerformanceConfig.monitoring, ...config.monitoring },
  }), [config]);

  return (
    <PerformanceContext.Provider value={mergedConfig}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook to use performance configuration
export const usePerformanceConfig = () => {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceConfig must be used within a PerformanceProvider');
  }
  return context;
};

// Adaptive performance configuration based on device and network
export const useAdaptivePerformanceConfig = () => {
  const baseConfig = usePerformanceConfig();
  const { isSlowConnection } = useNetworkAwareLoading();
  const { deviceCapabilities } = useAdaptiveLoading();

  const adaptiveConfig = React.useMemo(() => {
    const newConfig = { ...baseConfig };

    // Adjust for slow connections
    if (isSlowConnection) {
      newConfig.pagination.defaultPageSize = Math.min(newConfig.pagination.defaultPageSize, 10);
      newConfig.codeSplitting.preloadCriticalRoutes = false;
      newConfig.loadingStates.defaultTimeout = 60000; // Increase timeout
    }

    // Adjust for low-end devices
    if (deviceCapabilities.isLowEnd) {
      newConfig.virtualization.itemHeightThreshold = 50; // Enable virtualization sooner
      newConfig.pagination.defaultPageSize = Math.min(newConfig.pagination.defaultPageSize, 15);
      newConfig.monitoring.enableBundleAnalysis = false; // Disable to save memory
    }

    return newConfig;
  }, [baseConfig, isSlowConnection, deviceCapabilities]);

  return adaptiveConfig;
};

// Performance optimization recommendations
export const usePerformanceRecommendations = () => {
  const { isSlowConnection, connectionType } = useNetworkAwareLoading();
  const { deviceCapabilities } = useAdaptiveLoading();

  const recommendations = React.useMemo(() => {
    const recs: string[] = [];

    if (isSlowConnection) {
      recs.push('Consider reducing image sizes and enabling compression');
      recs.push('Implement progressive loading for better perceived performance');
    }

    if (deviceCapabilities.isLowEnd) {
      recs.push('Enable virtualization for large lists');
      recs.push('Reduce animation complexity');
      recs.push('Consider server-side rendering for critical content');
    }

    if (connectionType === '2g' || connectionType === 'slow-2g') {
      recs.push('Prioritize critical content loading');
      recs.push('Implement offline functionality where possible');
    }

    return recs;
  }, [isSlowConnection, connectionType, deviceCapabilities]);

  return recommendations;
};

// Performance metrics collector
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = React.useState({
    pageLoadTime: 0,
    timeToInteractive: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
  });

  React.useEffect(() => {
    // Collect Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              pageLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              timeToInteractive: navEntry.domInteractive - navEntry.fetchStart,
            }));
            break;
            
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({
                ...prev,
                firstContentfulPaint: entry.startTime,
              }));
            }
            break;
            
          case 'largest-contentful-paint':
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: entry.startTime,
            }));
            break;
            
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setMetrics(prev => ({
                ...prev,
                cumulativeLayoutShift: prev.cumulativeLayoutShift + (entry as any).value,
              }));
            }
            break;
            
          case 'first-input':
            setMetrics(prev => ({
              ...prev,
              firstInputDelay: (entry as any).processingStart - entry.startTime,
            }));
            break;
        }
      });
    });

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['navigation', 'paint'] });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      observer.observe({ entryTypes: ['layout-shift'] });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (_error) {
      // Some performance metrics not supported
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
};

// Performance warning system
export const PerformanceWarnings: React.FC = () => {
  const config = usePerformanceConfig();
  const metrics = usePerformanceMetrics();
  const recommendations = usePerformanceRecommendations();
  const [warnings, setWarnings] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!config.monitoring.logPerformanceWarnings) return;

    const newWarnings: string[] = [];

    // Check for performance issues
    if (metrics.pageLoadTime > 3000) {
      newWarnings.push('Page load time exceeds 3 seconds');
    }

    if (metrics.largestContentfulPaint > 2500) {
      newWarnings.push('Largest Contentful Paint is slow (>2.5s)');
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      newWarnings.push('High Cumulative Layout Shift detected');
    }

    if (metrics.firstInputDelay > 100) {
      newWarnings.push('First Input Delay is high (>100ms)');
    }

    // Performance warnings handled silently in production
    setWarnings(newWarnings);
  }, [metrics, recommendations, config.monitoring.logPerformanceWarnings]);

  // Only show in development
  if (typeof window === 'undefined' || window.location.hostname !== 'localhost' || warnings.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-sm z-50">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Performance Warnings</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  PerformanceProvider,
  usePerformanceConfig,
  useAdaptivePerformanceConfig,
  usePerformanceRecommendations,
  usePerformanceMetrics,
  PerformanceWarnings,
  defaultPerformanceConfig
};