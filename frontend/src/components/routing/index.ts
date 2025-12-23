export { AppRouter } from './AppRouter';
export { NotFoundPage } from './NotFoundPage';
export { ErrorBoundary } from './ErrorBoundary';
export { ConsoleLayout } from './ConsoleLayout';
export { ConsoleHeader } from './ConsoleHeader';
export { ServiceNavigation } from './ServiceNavigation';
export { ServiceSwitcher } from './ServiceSwitcher';
export { GlobalSearch } from './GlobalSearch';
export { SearchPage } from './SearchPage';
export { SearchResultCard } from './SearchResultCard';
export { SearchFilters } from './SearchFilters';
export { NotificationCenter } from './NotificationCenter';
export { NotificationPage } from './NotificationPage';
export { CommunicationPage } from './CommunicationPage';
export { BreadcrumbBar } from './BreadcrumbBar';
export { PageHeader } from './PageHeader';
export { ResourceListPage } from './ResourceListPage';
export { ResourceDetailPage, OverviewTab, SettingsTab, ActivityTab } from './ResourceDetailPage';
export { ServiceDashboard } from './ServiceDashboard';

// Performance and Loading Components
export * from './LoadingStates';
export * from './LazyLoadingUtils';
export * from './PerformanceUtils';
export * from './CodeSplitting';
export * from './PerformanceConfig';
export { 
  PerformanceOptimizedPage,
  OptimizedDataTable,
  OptimizedList,
  OptimizedDashboard
} from './PerformanceOptimizedPage';
export { PerformanceIntegrationExample } from './PerformanceIntegrationExample';
export { OptimizedRoutes, routePreloadConfig, useRouteMetrics } from './OptimizedRoutes';