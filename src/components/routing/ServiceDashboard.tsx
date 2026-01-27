import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import {
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { AfCard } from '@/components/attendflow/AfCard';

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
      <div className="min-h-screen bg-background">
        <PageHeader
          title={`${service} Dashboard`}
          subtitle={`Manage your ${service.toLowerCase()} resources`}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`${service} Dashboard`}
        subtitle={`Manage your ${service.toLowerCase()} resources`}
        actions={pageActions}
      />
 
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`p-4 sm:p-5 rounded-lg border-2 border-dashed text-left hover:border-solid transition-all ${
                    action.variant === 'primary'
                      ? 'border-primary/40 hover:border-primary hover:bg-primary/5'
                      : 'border-border hover:border-foreground/40 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <action.icon
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        action.variant === 'primary'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">{action.label}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
 
        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
          {widgets.map((widget) => (
            <AfCard
              key={widget.id}
              subtle
              className={getWidgetSizeClasses(widget.size)}
            >
              <DashboardWidget widget={widget} />
            </AfCard>
          ))}
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="text-center py-10 sm:py-12">
            <ChartBarIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No widgets configured</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Get started by adding some widgets to your dashboard.
            </p>
            {onCustomizeLayout && (
              <div className="mt-5 sm:mt-6">
                <button
                  onClick={onCustomizeLayout}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }
 
  if (widget.error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <h3 className="font-medium">{widget.title}</h3>
        </div>
        <p className="text-xs sm:text-sm text-destructive/80">{widget.error}</p>
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
          <h3 className="font-medium text-foreground mb-2">{widget.title}</h3>
          <p className="text-sm text-muted-foreground">Widget type not supported</p>
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
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
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
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {label && <div className="text-sm text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
};

const ChartWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{widget.title}</h3>
      <div className="h-32 bg-muted rounded flex items-center justify-center">
        <ChartBarIcon className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Chart placeholder</span>
      </div>
    </div>
  );
};

const TableWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { headers, rows } = data;

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              {headers?.map((header: string, index: number) => (
                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows?.slice(0, 5).map((row: any[], index: number) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-sm text-foreground">
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
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <ul className="space-y-2">
        {items?.slice(0, 5).map((item: any, index: number) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{item.label || item.name || item}</span>
            {item.value && <span className="text-muted-foreground">{item.value}</span>}
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
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
      case 'offline':
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        {message && <p className="text-sm text-foreground">{message}</p>}
        {details && <p className="text-xs text-muted-foreground">{details}</p>}
      </div>
    </div>
  );
};

const QuickActionWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { title, data } = widget;
  const { actions } = data;

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="space-y-2">
        {actions?.map((action: any, index: number) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceDashboard;