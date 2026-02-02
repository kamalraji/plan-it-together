import React, { useState, useMemo } from 'react';
import { PageHeader } from './PageHeader';
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { ConfirmationDialog, useConfirmation } from '@/components/ui/confirmation-dialog';

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any) => React.ReactNode;
}

interface BulkAction {
  label: string;
  action: (selectedItems: any[]) => void;
  icon?: React.ComponentType<{ className?: string }>;
  confirmationRequired?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'search' | 'date' | 'toggle';
  options?: { label: string; value: any }[];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface ResourceListPageProps {
  title: string;
  subtitle?: string;
  resourceType: string;
  data: any[];
  columns: TableColumn[];
  filters?: FilterDefinition[];
  bulkActions?: BulkAction[];
  searchable?: boolean;
  exportable?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  onCreateNew?: () => void;
  onRowClick?: (record: any) => void;
  pageSize?: number;
}

export const ResourceListPage: React.FC<ResourceListPageProps> = ({
  title,
  subtitle,
  resourceType,
  data,
  columns,
  filters = [],
  bulkActions = [],
  searchable = true,
  exportable: _exportable = false,
  loading = false,
  onRefresh,
  onCreateNew,
  onRowClick,
  pageSize = 20,
}) => {
  const { confirm, dialogProps } = useConfirmation();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewType, setViewType] = useState<'table' | 'cards' | 'list'>('table');

  // Apply filters and search
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        columns.some(col => {
          const value = item[col.key];
          return value && value.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (typeof value === 'boolean') {
            return itemValue === value;
          }
          return itemValue === value || (Array.isArray(value) && value.includes(itemValue));
        });
      }
    });

    return filtered;
  }, [data, searchQuery, filterValues, columns]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    setSortConfig(current => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkAction = async (action: BulkAction) => {
    const selectedData = data.filter(item => selectedItems.has(item.id));
    if (action.confirmationRequired) {
      const confirmed = await confirm({
        title: action.label,
        description: `Are you sure you want to ${action.label.toLowerCase()} ${selectedItems.size} items?`,
        confirmLabel: action.label,
        variant: action.variant === 'danger' ? 'danger' : 'warning',
      });
      if (confirmed) {
        action.action(selectedData);
        setSelectedItems(new Set());
      }
    } else {
      action.action(selectedData);
      setSelectedItems(new Set());
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-gray-600" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-gray-600" />
    );
  };

  // Prepare page header props
  const pageActions = [];
  if (onCreateNew) {
    pageActions.push({
      label: `Create ${resourceType}`,
      action: onCreateNew,
      variant: 'primary' as const,
    });
  }
  if (onRefresh) {
    pageActions.push({
      label: 'Refresh',
      action: onRefresh,
      variant: 'secondary' as const,
    });
  }

  const pageFilters = [];
  if (searchable) {
    pageFilters.push({
      id: 'search',
      label: 'Search',
      type: 'search' as const,
      value: searchQuery,
      onChange: setSearchQuery,
    });
  }

  filters.forEach(filter => {
    pageFilters.push({
      id: filter.key,
      label: filter.label,
      type: filter.type,
      value: filterValues[filter.key] || '',
      options: filter.options,
      onChange: (value: any) => setFilterValues(prev => ({ ...prev, [filter.key]: value })),
    });
  });

  const viewControls = [
    { type: 'table' as const, active: viewType === 'table', onChange: (type: string) => setViewType(type as 'table' | 'cards' | 'list') },
    { type: 'cards' as const, active: viewType === 'cards', onChange: (type: string) => setViewType(type as 'table' | 'cards' | 'list') },
    { type: 'list' as const, active: viewType === 'list', onChange: (type: string) => setViewType(type as 'table' | 'cards' | 'list') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={pageActions}
        filters={pageFilters}
        viewControls={viewControls}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Bulk Actions Bar */}
        {selectedItems.size > 0 && bulkActions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex space-x-2">
                {bulkActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleBulkAction(action)}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${action.variant === 'danger'
                        ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500'
                      }`}
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Display */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          ) : viewType === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {bulkActions.length > 0 && (
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        style={{ width: column.width }}
                      >
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key)}
                            className="group inline-flex items-center space-x-1 hover:text-gray-700"
                          >
                            <span>{column.label}</span>
                            {getSortIcon(column.key)}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {bulkActions.length > 0 && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                            }`}
                        >
                          {column.render ? column.render(item[column.key], item) : item[column.key]}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle row actions menu
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <p className="text-gray-500 text-center">
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)} view not implemented yet
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, sortedData.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{sortedData.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmationDialog {...dialogProps} />
    </div>
  );
};

export default ResourceListPage;