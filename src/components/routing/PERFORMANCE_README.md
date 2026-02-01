# Performance Optimization and Loading States

This directory contains comprehensive performance optimization utilities and loading state components for the frontend routing and navigation system. The implementation follows AWS Console design patterns and provides enterprise-grade performance optimizations.

## Overview

The performance optimization system includes:

- **Loading States**: Skeleton screens, spinners, and progress indicators
- **Lazy Loading**: Code splitting and component lazy loading
- **Virtualization**: Virtual scrolling for large datasets
- **Error Handling**: Retry mechanisms and graceful error recovery
- **Performance Monitoring**: Real-time performance metrics and warnings
- **Adaptive Loading**: Network and device-aware optimizations

## Components

### Loading States (`LoadingStates.tsx`)

Provides various loading indicators and skeleton screens:

- `LoadingSpinner` - Configurable spinner component
- `PageLoading` - Full-page loading indicator
- `SkeletonCard`, `SkeletonTable`, `SkeletonList` - Content placeholders
- `ProgressBar` - Progress indication for long operations
- `LoadingButton` - Button with loading state
- `LoadingOverlay` - Overlay loading state for existing content

### Lazy Loading (`LazyLoadingUtils.tsx`)

Advanced lazy loading and error handling:

- `RetryableErrorBoundary` - Error boundary with retry functionality
- `createLazyComponent` - Factory for lazy-loaded components
- `SuspenseWrapper` - Suspense wrapper with custom fallbacks
- `NetworkAwareLoading` - Loading adapted to network conditions
- `ProgressiveLoader` - Progressive loading for large datasets

### Performance Utils (`PerformanceUtils.tsx`)

Performance optimization utilities:

- `usePerformanceMonitor` - Real-time performance metrics
- `useVirtualScrolling` - Virtual scrolling for large lists
- `usePagination` - Optimized pagination with prefetching
- `useDebouncedSearch` - Debounced search to reduce API calls
- `VirtualizedList` - High-performance list component
- `PaginationControls` - Pagination UI component

### Code Splitting (`CodeSplitting.tsx`)

Route-based code splitting utilities:

- `createLazyRoute` - Factory for lazy-loaded routes
- `RouteWrapper` - Route wrapper with suspense and error boundaries
- `useRoutePreloading` - Intelligent route preloading
- `useNetworkAwareLoading` - Network condition detection
- `useAdaptiveLoading` - Device capability detection

### Performance Configuration (`PerformanceConfig.tsx`)

Global performance configuration system:

- `PerformanceProvider` - Context provider for performance settings
- `usePerformanceConfig` - Access to performance configuration
- `useAdaptivePerformanceConfig` - Adaptive configuration based on conditions
- `usePerformanceMetrics` - Core Web Vitals collection
- `PerformanceWarnings` - Development performance warnings

### Optimized Components (`PerformanceOptimizedPage.tsx`)

High-level optimized components:

- `PerformanceOptimizedPage` - Page wrapper with all optimizations
- `OptimizedDataTable` - High-performance data table
- `OptimizedList` - Optimized list with progressive loading
- `OptimizedDashboard` - Dashboard with widget optimization

## Usage Examples

### Basic Page with Loading States

```tsx
import { PerformanceOptimizedPage } from './components/routing';

const MyPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <PerformanceOptimizedPage
      loading={loading}
      error={error}
      onRetry={() => setError(null)}
      loadingType="dashboard"
      enableMetrics={true}
    >
      {/* Your page content */}
    </PerformanceOptimizedPage>
  );
};
```

### Lazy-Loaded Routes

```tsx
import { createLazyRoute, RouteWrapper } from './components/routing';

const LazyDashboard = createLazyRoute(
  () => import('./DashboardPage'),
  { preload: true, errorBoundary: true }
);

const App = () => (
  <Routes>
    <Route 
      path="/dashboard" 
      element={
        <RouteWrapper loadingType="dashboard">
          <LazyDashboard />
        </RouteWrapper>
      } 
    />
  </Routes>
);
```

### Optimized Data Table

```tsx
import { OptimizedDataTable } from './components/routing';

const DataPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <OptimizedDataTable
      data={data}
      columns={columns}
      searchable={true}
      paginated={true}
      virtualized={data.length > 100}
      loading={loading}
    />
  );
};
```

### Performance Configuration

```tsx
import { PerformanceProvider } from './components/routing';

const App = () => (
  <PerformanceProvider
    config={{
      pagination: { defaultPageSize: 25 },
      virtualization: { enableVirtualScrolling: true },
      monitoring: { enableMetrics: true }
    }}
  >
    <Router>
      {/* Your app routes */}
    </Router>
  </PerformanceProvider>
);
```

## Performance Features

### 1. Loading States
- **Skeleton Screens**: Provide visual placeholders during loading
- **Progressive Loading**: Load content in batches for better UX
- **Loading Indicators**: Spinners and progress bars for feedback
- **Timeout Handling**: Graceful handling of slow operations

### 2. Code Splitting
- **Route-based Splitting**: Separate bundles for different routes
- **Component Lazy Loading**: Load components on demand
- **Preloading**: Intelligent preloading based on user behavior
- **Bundle Analysis**: Development tools for bundle optimization

### 3. Virtualization
- **Virtual Scrolling**: Handle large datasets efficiently
- **Adaptive Thresholds**: Enable based on data size and device
- **Memory Management**: Minimize DOM nodes for performance
- **Smooth Scrolling**: Maintain 60fps scrolling performance

### 4. Error Handling
- **Retry Mechanisms**: Automatic and manual retry options
- **Error Boundaries**: Isolate errors to prevent app crashes
- **Graceful Degradation**: Fallback UI for error states
- **Network Error Handling**: Special handling for network issues

### 5. Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS measurement
- **Custom Metrics**: Load time, render time tracking
- **Performance Warnings**: Development-time alerts
- **Bundle Analysis**: Code splitting effectiveness

### 6. Adaptive Optimizations
- **Network Awareness**: Adapt to connection speed
- **Device Capabilities**: Optimize for device memory/CPU
- **Battery Considerations**: Reduce animations on low battery
- **Accessibility**: Respect reduced motion preferences

## Best Practices

### 1. Loading States
- Always provide loading feedback for operations > 200ms
- Use skeleton screens for content-heavy pages
- Implement progressive loading for large datasets
- Provide clear error messages with recovery options

### 2. Code Splitting
- Split routes at logical boundaries
- Preload critical routes on app initialization
- Use hover/focus preloading for likely navigation
- Monitor bundle sizes and optimize regularly

### 3. Performance Monitoring
- Enable metrics in development for optimization
- Monitor Core Web Vitals in production
- Set performance budgets and alerts
- Regular performance audits and optimization

### 4. Error Handling
- Implement retry mechanisms for transient errors
- Provide clear error messages and recovery paths
- Use error boundaries to prevent cascading failures
- Log errors for monitoring and debugging

## Configuration Options

The performance system is highly configurable through the `PerformanceConfig`:

```typescript
interface PerformanceConfig {
  loadingStates: {
    enableSkeletonScreens: boolean;
    enableProgressBars: boolean;
    defaultTimeout: number;
  };
  codeSplitting: {
    enableLazyLoading: boolean;
    preloadCriticalRoutes: boolean;
    chunkSizeThreshold: number;
  };
  virtualization: {
    enableVirtualScrolling: boolean;
    itemHeightThreshold: number;
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
    enablePrefetching: boolean;
  };
  errorHandling: {
    maxRetries: number;
    retryDelay: number;
    enableErrorBoundaries: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableBundleAnalysis: boolean;
    logPerformanceWarnings: boolean;
  };
}
```

## Development Tools

### Performance Metrics Display
- Real-time performance metrics in development
- Bundle size and chunk analysis
- Network condition simulation
- Performance warnings and recommendations

### Bundle Analysis
- Webpack bundle analyzer integration
- Chunk size monitoring
- Dependency analysis
- Optimization recommendations

### Performance Warnings
- Automatic detection of performance issues
- Recommendations for optimization
- Core Web Vitals monitoring
- Development-time alerts

## Browser Support

The performance optimizations support:
- Modern browsers with ES2018+ support
- Progressive enhancement for older browsers
- Graceful fallbacks for unsupported features
- Polyfills for critical functionality

## Testing

Performance components include:
- Unit tests for individual utilities
- Integration tests for complete workflows
- Performance benchmarks
- Accessibility testing
- Cross-browser compatibility tests

## Migration Guide

To integrate performance optimizations into existing components:

1. Wrap pages with `PerformanceOptimizedPage`
2. Replace data tables with `OptimizedDataTable`
3. Add loading states to async operations
4. Implement lazy loading for routes
5. Configure performance settings via `PerformanceProvider`

## Troubleshooting

Common issues and solutions:

### Slow Loading
- Check network conditions and adapt accordingly
- Implement progressive loading
- Optimize bundle sizes
- Enable preloading for critical routes

### Memory Issues
- Enable virtualization for large lists
- Implement proper cleanup in useEffect
- Monitor memory usage in development
- Use React.memo for expensive components

### Bundle Size
- Analyze bundle composition
- Implement proper code splitting
- Remove unused dependencies
- Optimize imports (tree shaking)

## Contributing

When adding new performance features:
1. Follow existing patterns and conventions
2. Add comprehensive TypeScript types
3. Include unit tests and documentation
4. Consider accessibility implications
5. Test across different devices and networks