import React, { useState } from 'react';
import { 
  PageLoading, 
  LoadingOverlay, 
  SkeletonDashboard, 
  SkeletonTable, 
  SkeletonList,
  ContentPlaceholder 
} from './LoadingStates';
import { 
  RetryableErrorBoundary, 
  NetworkAwareLoading, 
  SlowNetworkFallback,
  ProgressiveLoader 
} from './LazyLoadingUtils';
import { 
  usePagination, 
  useDebouncedSearch, 
  VirtualizedList,
  PaginationControls,
  PerformanceMetrics 
} from './PerformanceUtils';

// Performance-optimized page wrapper
export const PerformanceOptimizedPage: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingType?: 'page' | 'dashboard' | 'table' | 'list';
  enableMetrics?: boolean;
}> = ({ 
  children, 
  loading = false, 
  error = null, 
  onRetry,
  loadingType = 'page',
  enableMetrics = false 
}) => {
  const getLoadingComponent = () => {
    switch (loadingType) {
      case 'dashboard':
        return SkeletonDashboard;
      case 'table':
        return () => <SkeletonTable rows={5} columns={4} />;
      case 'list':
        return () => <SkeletonList items={6} />;
      default:
        return PageLoading;
    }
  };

  const LoadingComponent = getLoadingComponent();

  if (loading) {
    return (
      <NetworkAwareLoading slowNetworkFallback={SlowNetworkFallback}>
        <LoadingComponent />
      </NetworkAwareLoading>
    );
  }

  if (error) {
    return (
      <ContentPlaceholder
        title="Something went wrong"
        description={error.message || 'An unexpected error occurred'}
        action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        }
      />
    );
  }

  return (
    <RetryableErrorBoundary maxRetries={3}>
      {children}
      {enableMetrics && <PerformanceMetrics />}
    </RetryableErrorBoundary>
  );
};

// Optimized data table component
export const OptimizedDataTable: React.FC<{
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, record: any) => React.ReactNode;
  }>;
  searchable?: boolean;
  paginated?: boolean;
  itemsPerPage?: number;
  virtualized?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  loading?: boolean;
  onRowClick?: (record: any) => void;
}> = ({
  data,
  columns,
  searchable = false,
  paginated = true,
  itemsPerPage = 10,
  virtualized = false,
  itemHeight = 60,
  containerHeight = 400,
  loading = false,
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, 300);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [data, debouncedSearchTerm]);

  const {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
  } = usePagination(filteredData, itemsPerPage);

  const renderRow = (item: any, index: number) => (
    <tr
      key={index}
      className={`hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
          {column.render ? column.render(item[column.key], item) : item[column.key]}
        </td>
      ))}
    </tr>
  );

  if (loading) {
    return <SkeletonTable rows={itemsPerPage} columns={columns.length} />;
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus-visible:ring-ring focus-visible:border-primary"
          />
        </div>
      )}

      <div className="bg-card shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {virtualized ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <VirtualizedList
                    items={paginated ? currentItems : filteredData}
                    itemHeight={itemHeight}
                    containerHeight={containerHeight}
                    renderItem={renderRow}
                  />
                </td>
              </tr>
            ) : (
              (paginated ? currentItems : filteredData).map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No data found</p>
          </div>
        )}
      </div>

      {paginated && filteredData.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
};

// Optimized list component with progressive loading
export const OptimizedList: React.FC<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  loading?: boolean;
  progressive?: boolean;
  batchSize?: number;
  searchable?: boolean;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}> = ({
  items,
  renderItem,
  loading = false,
  progressive = false,
  batchSize = 20,
  searchable = false,
  emptyState
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, 300);

  const filteredItems = React.useMemo(() => {
    if (!debouncedSearchTerm) return items;
    
    return items.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [items, debouncedSearchTerm]);

  if (loading) {
    return <SkeletonList items={batchSize} />;
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus-visible:ring-ring focus-visible:border-primary"
          />
        </div>
      )}

      {filteredItems.length === 0 ? (
        emptyState ? (
          <ContentPlaceholder
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        )
      ) : progressive ? (
        <ProgressiveLoader
          items={filteredItems}
          batchSize={batchSize}
          renderItem={renderItem}
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </div>
  );
};

// Performance-optimized dashboard component
export const OptimizedDashboard: React.FC<{
  widgets: Array<{
    id: string;
    title: string;
    component: React.ComponentType<any>;
    props?: any;
    loading?: boolean;
    error?: Error | null;
  }>;
  loading?: boolean;
  columns?: number;
}> = ({ widgets, loading = false, columns = 3 }) => {
  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {widgets.map((widget) => (
        <div key={widget.id} className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">{widget.title}</h3>
          
          <LoadingOverlay isLoading={widget.loading || false}>
            {widget.error ? (
              <ContentPlaceholder
                title="Error loading widget"
                description={widget.error.message}
                icon={
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
            ) : (
              <widget.component {...(widget.props || {})} />
            )}
          </LoadingOverlay>
        </div>
      ))}
    </div>
  );
};

export default PerformanceOptimizedPage;