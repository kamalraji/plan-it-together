import React, { useState } from 'react';
import {
  PerformanceOptimizedPage,
  OptimizedDataTable,
  OptimizedList,
  OptimizedDashboard
} from './PerformanceOptimizedPage';
import {
  PageLoading,
  SkeletonTable,
  LoadingButton
} from './LoadingStates';
import {
  SuspenseWrapper
} from './LazyLoadingUtils';
import {
  usePerformanceMonitor
} from './PerformanceUtils';

// Example lazy-loaded components for demonstration
const LazyDashboard = () => (
  <div className="p-6">
    <h3 className="text-lg font-medium mb-4">Lazy Loaded Dashboard</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Widget 1</h4>
        <p className="text-sm text-muted-foreground">This widget was lazy loaded</p>
      </div>
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Widget 2</h4>
        <p className="text-sm text-muted-foreground">Performance optimized content</p>
      </div>
    </div>
  </div>
);

const LazyResourceList = () => (
  <div className="p-6">
    <h3 className="text-lg font-medium mb-4">Lazy Loaded Resource List</h3>
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="bg-muted/50 p-3 rounded border">
          <div className="font-medium">Resource {i + 1}</div>
          <div className="text-sm text-muted-foreground">Lazy loaded resource item</div>
        </div>
      ))}
    </div>
  </div>
);

// Mock data for demonstration
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
    created: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
    value: Math.floor(Math.random() * 1000),
    category: ['Category A', 'Category B', 'Category C'][Math.floor(Math.random() * 3)]
  }));
};

// Performance demonstration component
export const PerformanceIntegrationExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'list' | 'dashboard' | 'lazy'>('table');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(generateMockData(1000));
  const [error, setError] = useState<Error | null>(null);
  
  const metrics = usePerformanceMonitor();

  // Simulate data loading
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setData(generateMockData(1000));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Simulate error
  const handleError = () => {
    setError(new Error('Simulated error for testing error handling'));
  };

  // Table columns configuration
  const tableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'inactive' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'created', label: 'Created' },
    { key: 'value', label: 'Value' },
    { key: 'category', label: 'Category' }
  ];

  // Dashboard widgets configuration
  const dashboardWidgets = [
    {
      id: 'metrics',
      title: 'Performance Metrics',
      component: () => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Load Time:</span>
            <span className="text-sm font-medium">{metrics.loadTime.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Memory Usage:</span>
            <span className="text-sm font-medium">{(metrics.memoryUsage * 100).toFixed(1)}%</span>
          </div>
        </div>
      ),
      loading: false
    },
    {
      id: 'data-summary',
      title: 'Data Summary',
      component: () => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Items:</span>
            <span className="text-sm font-medium">{data.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Active:</span>
            <span className="text-sm font-medium">
              {data.filter(item => item.status === 'active').length}
            </span>
          </div>
        </div>
      ),
      loading: loading
    },
    {
      id: 'actions',
      title: 'Quick Actions',
      component: () => (
        <div className="space-y-2">
          <LoadingButton
            isLoading={loading}
            onClick={handleRefresh}
            className="w-full"
          >
            Refresh Data
          </LoadingButton>
          <button
            onClick={handleError}
            className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Simulate Error
          </button>
        </div>
      ),
      loading: false
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'table':
        return (
          <OptimizedDataTable
            data={data}
            columns={tableColumns}
            searchable={true}
            paginated={true}
            itemsPerPage={20}
            loading={loading}
            onRowClick={(record) => console.log('Row clicked:', record)}
          />
        );

      case 'list':
        return (
          <OptimizedList
            items={data}
            loading={loading}
            progressive={true}
            batchSize={25}
            searchable={true}
            renderItem={(item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.value}</p>
                  </div>
                </div>
              </div>
            )}
            emptyState={{
              title: 'No items found',
              description: 'Try adjusting your search criteria',
              action: {
                label: 'Clear Search',
                onClick: () => console.log('Clear search')
              }
            }}
          />
        );

      case 'dashboard':
        return (
          <OptimizedDashboard
            widgets={dashboardWidgets}
            loading={loading}
            columns={3}
          />
        );

      case 'lazy':
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Lazy Loaded Dashboard</h3>
              <SuspenseWrapper fallback={PageLoading} errorBoundary={true}>
                <LazyDashboard />
              </SuspenseWrapper>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Lazy Loaded Resource List</h3>
              <SuspenseWrapper fallback={SkeletonTable} errorBoundary={true}>
                <LazyResourceList />
              </SuspenseWrapper>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PerformanceOptimizedPage
      loading={false}
      error={error}
      onRetry={() => setError(null)}
      enableMetrics={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Performance Optimization Demo
          </h1>
          <p className="text-muted-foreground">
            This page demonstrates various performance optimization techniques including
            lazy loading, virtualization, pagination, and error handling.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card shadow rounded-lg">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'table', label: 'Optimized Table' },
                { key: 'list', label: 'Progressive List' },
                { key: 'dashboard', label: 'Dashboard Widgets' },
                { key: 'lazy', label: 'Lazy Loading' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Performance Info */}
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Performance Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Loading States</h4>
              <p className="text-sm text-muted-foreground">
                Skeleton screens, spinners, and progress indicators for better UX
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Lazy Loading</h4>
              <p className="text-sm text-muted-foreground">
                Code splitting and component lazy loading for faster initial loads
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Virtualization</h4>
              <p className="text-sm text-muted-foreground">
                Virtual scrolling for large datasets to maintain performance
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Error Handling</h4>
              <p className="text-sm text-muted-foreground">
                Retry mechanisms and graceful error recovery
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Search Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Debounced search to reduce unnecessary API calls
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Pagination</h4>
              <p className="text-sm text-muted-foreground">
                Smart pagination with prefetching for smooth navigation
              </p>
            </div>
          </div>
        </div>
      </div>
    </PerformanceOptimizedPage>
  );
};