import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { createLazyRoute, RouteWrapper } from './CodeSplitting';
import { PerformanceIntegrationExample } from './PerformanceIntegrationExample';

// Example lazy-loaded components (these would be actual page components in a real app)
const LazyDashboard = createLazyRoute(
  () => Promise.resolve({ 
    default: () => (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>This is a lazy-loaded dashboard component.</p>
      </div>
    )
  }),
  { 
    preload: true, 
    errorBoundary: true,
    chunkName: 'dashboard'
  }
);

const LazyEventList = createLazyRoute(
  () => Promise.resolve({ 
    default: () => (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Events</h1>
        <p>This is a lazy-loaded events list component.</p>
      </div>
    )
  }),
  { 
    errorBoundary: true,
    chunkName: 'events'
  }
);

const LazyProfile = createLazyRoute(
  () => Promise.resolve({ 
    default: () => (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p>This is a lazy-loaded profile component.</p>
      </div>
    )
  }),
  { 
    errorBoundary: true,
    chunkName: 'profile'
  }
);

// Optimized routes configuration
export const OptimizedRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard - preloaded for faster access */}
      <Route 
        path="/dashboard" 
        element={
          <RouteWrapper loadingType="dashboard" errorBoundary={true}>
            <LazyDashboard />
          </RouteWrapper>
        } 
      />

      {/* Event Management Routes */}
      <Route 
        path="/events" 
        element={
          <RouteWrapper loadingType="table" errorBoundary={true}>
            <LazyEventList />
          </RouteWrapper>
        } 
      />

      {/* Profile Routes */}
      <Route 
        path="/profile" 
        element={
          <RouteWrapper loadingType="page" errorBoundary={true}>
            <LazyProfile />
          </RouteWrapper>
        } 
      />

      {/* Performance Demo Route */}
      <Route 
        path="/performance-demo" 
        element={
          <RouteWrapper loadingType="page" errorBoundary={true}>
            <PerformanceIntegrationExample />
          </RouteWrapper>
        } 
      />
    </Routes>
  );
};

// Route preloading configuration
export const routePreloadConfig = {
  // Routes to preload on app initialization
  critical: ['/dashboard'],
  
  // Routes to preload on user interaction
  onHover: ['/events', '/profile'],
  
  // Routes to load on demand only
  onDemand: ['/performance-demo']
};

// Route performance monitoring
export const useRouteMetrics = () => {
  const [routeMetrics, setRouteMetrics] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    // Monitor route changes and performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          setRouteMetrics(prev => ({
            ...prev,
            [window.location.pathname]: {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              timestamp: Date.now()
            }
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  return routeMetrics;
};

export default OptimizedRoutes;