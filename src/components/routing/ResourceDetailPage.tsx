import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import {
  PencilIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { ConfirmationDialog, useConfirmation } from '@/components/ui/confirmation-dialog';

interface DetailTab {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  badge?: string | number;
  props?: any;
}

interface ResourceAction {
  label: string;
  action: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'danger';
  confirmationRequired?: boolean;
  disabled?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface ResourceDetailPageProps {
  title: string;
  subtitle?: string;
  resourceId: string;
  resourceType: string;
  breadcrumbs?: BreadcrumbItem[];
  tabs: DetailTab[];
  actions?: ResourceAction[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const ResourceDetailPage: React.FC<ResourceDetailPageProps> = ({
  title,
  subtitle,
  resourceId,
  resourceType,
  breadcrumbs,
  tabs,
  actions = [],
  loading = false,
  error,
  onRefresh,
  children,
}) => {
  const { confirm, dialogProps } = useConfirmation();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  const [showMoreActions, setShowMoreActions] = useState(false);

  const handleAction = async (action: ResourceAction) => {
    if (action.confirmationRequired) {
      const confirmed = await confirm({
        title: action.label,
        description: `Are you sure you want to ${action.label.toLowerCase()}?`,
        confirmLabel: action.label,
        variant: action.variant === 'danger' ? 'danger' : 'warning',
      });
      if (confirmed) {
        action.action();
      }
    } else {
      action.action();
    }
    setShowMoreActions(false);
  };

  // Separate primary actions from secondary actions
  const primaryActions = actions.filter(action => action.variant === 'primary').slice(0, 2);
  const secondaryActions = actions.filter(action => action.variant !== 'primary' || !primaryActions.includes(action));

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveTabComponent = activeTabData?.component;

  // Prepare page header props
  const pageActions = [
    ...primaryActions,
    ...(secondaryActions.length > 0 ? [{
      label: 'More',
      action: () => setShowMoreActions(!showMoreActions),
      variant: 'secondary' as const,
      icon: EllipsisHorizontalIcon,
    }] : []),
  ];

  if (onRefresh) {
    pageActions.push({
      label: 'Refresh',
      action: onRefresh,
      variant: 'secondary' as const,
    });
  }

  const tabConfigs = tabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    current: tab.id === activeTab,
    badge: tab.badge,
    onClick: () => setActiveTab(tab.id),
  }));

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-muted/50">
          <PageHeader
            title="Loading..."
            breadcrumbs={breadcrumbs}
          />
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-card shadow rounded-lg p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
        <ConfirmationDialog {...dialogProps} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-muted/50">
          <PageHeader
            title="Error"
            breadcrumbs={breadcrumbs}
            actions={onRefresh ? [{
              label: 'Retry',
              action: onRefresh,
              variant: 'primary' as const,
            }] : []}
          />
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-card shadow rounded-lg p-8">
              <div className="text-center">
                <div className="text-red-600 text-lg font-medium mb-2">
                  Failed to load {resourceType}
                </div>
                <p className="text-muted-foreground mb-4">{error}</p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <ConfirmationDialog {...dialogProps} />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-muted/50">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={pageActions}
        tabs={tabConfigs}
      >
        {children}
      </PageHeader>

      {/* Secondary Actions Dropdown */}
      {showMoreActions && secondaryActions.length > 0 && (
        <div className="relative">
          <div className="absolute right-4 top-2 z-50 w-56 bg-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {secondaryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled}
                  className={`group flex items-center w-full px-4 py-2 text-sm text-left hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                    action.variant === 'danger' ? 'text-red-700 hover:bg-red-50' : 'text-foreground'
                  }`}
                >
                  {action.icon && (
                    <action.icon className={`mr-3 h-4 w-4 ${
                      action.variant === 'danger' ? 'text-red-500' : 'text-muted-foreground'
                    }`} />
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMoreActions(false)}
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-card shadow rounded-lg">
          {ActiveTabComponent ? (
            <div className="p-6">
              <ActiveTabComponent
                resourceId={resourceId}
                resourceType={resourceType}
                {...(activeTabData?.props || {})}
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center text-muted-foreground">
                <p>Tab content not available</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      <ConfirmationDialog {...dialogProps} />
    </>
  );
};

// Example tab components that can be used with ResourceDetailPage

export const OverviewTab: React.FC<{ resourceId: string; resourceType: string; data?: any }> = ({
  resourceId,
  resourceType,
  data,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">ID</dt>
            <dd className="mt-1 text-sm text-foreground">{resourceId}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Type</dt>
            <dd className="mt-1 text-sm text-foreground">{resourceType}</dd>
          </div>
          {data && Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SettingsTab: React.FC<{ resourceId: string; resourceType: string }> = ({
  resourceId,
  resourceType,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Settings</h3>
        <p className="text-muted-foreground">
          Settings for {resourceType} {resourceId} will be displayed here.
        </p>
      </div>
    </div>
  );
};

export const ActivityTab: React.FC<{ resourceType: string }> = ({
  resourceType,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Activity</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            <li>
              <div className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-muted-foreground/20 flex items-center justify-center ring-8 ring-background">
                      <PencilIcon className="h-4 w-4 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {resourceType} created
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-muted-foreground">
                      <time>Just now</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;