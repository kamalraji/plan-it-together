import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import {
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'status' | 'quickAction';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  data: any;
  refreshInterval?: number;
  loading?: boolean;
  error?: string;
}

interface DashboardLayout {
  columns: number;
  rows: DashboardRow[];
  customizable: boolean;
}

interface DashboardRow {
  id: string;
  widgets: string[];
  height?: string;
}

interface QuickAction {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

interface ServiceDashboardProps {
  service: string;
  widgets: DashboardWidget[];
  layout?: DashboardLayout;
  quickActions?: QuickAction[];
  loading?: boolean;
  onRefresh?: () => void;
  onCustomizeLayout?: () => void;
}

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  service,
  widgets,
  quickActions = [],
  loading = false,
  onRefresh,
  onCustomizeLayout,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const getWidgetSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      case 'full':
        return 'col-span-full row-span-1';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  // Prepare page header
  const pageActions = [];
  if (onCustomizeLayout) {
    pageActions.push({
      label: 'Customize',
      action: onCustomizeLayout,
      variant: 'secondary' as const,
      icon: CogIcon,
    });
  }
  pageActions.push({
    label: 'Refresh',
    action: handleRefresh,
    variant: 'secondary' as const,
    loading: refreshing,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title={`${service} Dashboard`}
          subtitle={`Welcome to your ${service.toLowerCase()} dashboard`}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={`${service} Dashboard`}
        subtitle={`Welcome to your ${service.toLowerCase()} dashboard`}
        actions={pageActions}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`p-4 rounded-lg border-2 border-dashed text-left hover:border-solid transition-all ${
                    action.variant === 'primary'
                      ? 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className={`h-6 w-6 ${
                      action.variant === 'primary' ? 'text-indigo-600' : 'text-gray-600'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{action.label}</div>
                      <div className="text-sm text-gray-500">{action.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`bg-white rounded-lg shadow ${getWidgetSizeClasses(widget.size)}`}
            >
              <DashboardWidget widget={widget} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding some widgets to your dashboard.
            </p>
            {onCustomizeLayout && (
              <div className="mt-6">
                <button
                  onClick={onCustomizeLayout}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Widget
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual widget component
const DashboardWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  if (widget.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (widget.error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <h3 className="font-medium">{widget.title}</h3>
        </div>
        <p className="text-sm text-red-500">{widget.error}</p>
      </div>
    );
  }

  switch (widget.type) {
    case 'metric':
      return <MetricWidget widget={widget} />;
    case 'chart':
      return <ChartWidget widget={widget} />;
    case 'table':
      return <TableWidget widget={widget} />;
    case 'list':
      return <ListWidget widget={widget} />;
    case 'status':
      return <StatusWidget widget={widget} />;
    case 'quickAction':
      return <QuickActionWidget widget={widget} />;
    default:
      return (
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-2">{widget.title}</h3>
          <p className="text-sm text-gray-500">Widget type not supported</p>
        </div>
      );
  }
};

const MetricWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { value, change, changeType, label } = data;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {change && (
          <div className={`flex items-center text-sm ${
            changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
              changeType === 'decrease' ? 'rotate-180' : ''
            }`} />
            {change}
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {label && <div className="text-sm text-gray-500">{label}</div>}
      </div>
    </div>
  );
};

const ChartWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{widget.title}</h3>
      <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
        <ChartBarIcon className="h-8 w-8 text-gray-400" />
        <span className="ml-2 text-gray-500">Chart placeholder</span>
      </div>
    </div>
  );
};

const TableWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { headers, rows } = data;

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {headers?.map((header: string, index: number) => (
                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows?.slice(0, 5).map((row: any[], index: number) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ListWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { items } = data;

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <ul className="space-y-2">
        {items?.slice(0, 5).map((item: any, index: number) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-900">{item.label || item.name || item}</span>
            {item.value && <span className="text-gray-500">{item.value}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

const StatusWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { status, message, details } = data;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'offline':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        {message && <p className="text-sm text-gray-900">{message}</p>}
        {details && <p className="text-xs text-gray-500">{details}</p>}
      </div>
    </div>
  );
};

const QuickActionWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { actions } = data;

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <div className="space-y-2">
        {actions?.map((action: any, index: number) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceDashboard;