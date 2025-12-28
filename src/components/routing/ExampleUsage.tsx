import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { ResourceListPage } from './ResourceListPage';
import { ResourceDetailPage, OverviewTab, SettingsTab, ActivityTab } from './ResourceDetailPage';
import { ServiceDashboard } from './ServiceDashboard';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// Example usage of AWS-style page components

// Example 1: Service Dashboard
export const ExampleServiceDashboard: React.FC = () => {
  const widgets = [
    {
      id: 'total-events',
      type: 'metric' as const,
      title: 'Total Events',
      size: 'small' as const,
      data: {
        value: '24',
        change: '+12%',
        changeType: 'increase',
        label: 'This month',
      },
    },
    {
      id: 'active-users',
      type: 'metric' as const,
      title: 'Active Users',
      size: 'small' as const,
      data: {
        value: '1,234',
        change: '+5%',
        changeType: 'increase',
        label: 'Last 30 days',
      },
    },
    {
      id: 'revenue',
      type: 'metric' as const,
      title: 'Revenue',
      size: 'small' as const,
      data: {
        value: '$12,345',
        change: '-2%',
        changeType: 'decrease',
        label: 'This quarter',
      },
    },
    {
      id: 'system-status',
      type: 'status' as const,
      title: 'System Status',
      size: 'small' as const,
      data: {
        status: 'Healthy',
        message: 'All systems operational',
        details: 'Last checked: 2 minutes ago',
      },
    },
    {
      id: 'recent-events',
      type: 'list' as const,
      title: 'Recent Events',
      size: 'medium' as const,
      data: {
        items: [
          { label: 'Tech Conference 2024', value: 'Tomorrow' },
          { label: 'Workshop Series', value: 'Next Week' },
          { label: 'Annual Meetup', value: 'Next Month' },
        ],
      },
    },
    {
      id: 'performance-chart',
      type: 'chart' as const,
      title: 'Performance Metrics',
      size: 'medium' as const,
      data: {},
    },
  ];

  const quickActions = [
    {
      label: 'Create Event',
      description: 'Start a new event',
      icon: PlusIcon,
      action: () => console.log('Create event'),
      variant: 'primary' as const,
    },
    {
      label: 'Manage Users',
      description: 'User management',
      icon: UserIcon,
      action: () => console.log('Manage users'),
    },
    {
      label: 'View Calendar',
      description: 'Event calendar',
      icon: CalendarIcon,
      action: () => console.log('View calendar'),
    },
  ];

  return (
    <ServiceDashboard
      service="Event Management"
      widgets={widgets}
      quickActions={quickActions}
      onRefresh={() => console.log('Refreshing dashboard')}
      onCustomizeLayout={() => console.log('Customize layout')}
    />
  );
};

// Example 2: Resource List Page
export const ExampleResourceListPage: React.FC = () => {
  const [data] = useState([
    {
      id: '1',
      name: 'Tech Conference 2024',
      status: 'Active',
      attendees: 150,
      date: '2024-03-15',
      location: 'San Francisco',
    },
    {
      id: '2',
      name: 'Workshop Series',
      status: 'Draft',
      attendees: 0,
      date: '2024-04-01',
      location: 'Online',
    },
    {
      id: '3',
      name: 'Annual Meetup',
      status: 'Published',
      attendees: 75,
      date: '2024-05-10',
      location: 'New York',
    },
  ]);

  const columns = [
    {
      key: 'name',
      label: 'Event Name',
      sortable: true,
      filterable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' :
          value === 'Published' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'attendees',
      label: 'Attendees',
      sortable: true,
      filterable: false,
      align: 'right' as const,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      filterable: false,
    },
    {
      key: 'location',
      label: 'Location',
      sortable: false,
      filterable: true,
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Published', value: 'Published' },
      ],
    },
  ];

  const bulkActions = [
    {
      label: 'Publish',
      action: (items: any[]) => console.log('Publishing', items),
      variant: 'primary' as const,
    },
    {
      label: 'Archive',
      action: (items: any[]) => console.log('Archiving', items),
      confirmationRequired: true,
      variant: 'danger' as const,
    },
  ];

  return (
    <ResourceListPage
      title="Events"
      subtitle="Manage your events and conferences"
      resourceType="Event"
      data={data}
      columns={columns}
      filters={filters}
      bulkActions={bulkActions}
      searchable={true}
      exportable={true}
      onCreateNew={() => console.log('Create new event')}
      onRefresh={() => console.log('Refresh events')}
      onRowClick={(event) => console.log('View event', event)}
    />
  );
};

// Example 3: Resource Detail Page
export const ExampleResourceDetailPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Events', href: '/dashboard/eventmanagement' },
    { label: 'Tech Conference 2024', current: true },
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      component: OverviewTab,
      props: {
        data: {
          name: 'Tech Conference 2024',
          description: 'Annual technology conference',
          status: 'Active',
          attendees: 150,
          maxAttendees: 200,
          startDate: '2024-03-15',
          endDate: '2024-03-16',
          location: 'San Francisco, CA',
        },
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      component: SettingsTab,
    },
    {
      id: 'activity',
      label: 'Activity',
      component: ActivityTab,
      badge: '3',
    },
  ];

  const actions = [
    {
      label: 'Edit Event',
      action: () => console.log('Edit event'),
      icon: PencilIcon,
      variant: 'primary' as const,
    },
    {
      label: 'Delete Event',
      action: () => console.log('Delete event'),
      icon: TrashIcon,
      variant: 'danger' as const,
      confirmationRequired: true,
    },
  ];

  return (
    <ResourceDetailPage
      title="Tech Conference 2024"
      subtitle="Annual technology conference"
      resourceId="1"
      resourceType="Event"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      actions={actions}
      onRefresh={() => console.log('Refresh event')}
    />
  );
};

// Example 4: Simple Page Header Usage
export const ExamplePageHeader: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewType, setViewType] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Events', href: '/dashboard/eventmanagement' },
    { label: 'Analytics', current: true },
  ];

  const actions = [
    {
      label: 'Export Data',
      action: () => console.log('Export data'),
      variant: 'secondary' as const,
    },
    {
      label: 'Create Report',
      action: () => console.log('Create report'),
      variant: 'primary' as const,
      icon: PlusIcon,
    },
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      current: activeTab === 'overview',
      onClick: () => setActiveTab('overview'),
    },
    {
      id: 'performance',
      label: 'Performance',
      current: activeTab === 'performance',
      badge: '12',
      onClick: () => setActiveTab('performance'),
    },
    {
      id: 'insights',
      label: 'Insights',
      current: activeTab === 'insights',
      onClick: () => setActiveTab('insights'),
    },
  ];

  const filters = [
    {
      id: 'search',
      label: 'Search',
      type: 'search' as const,
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'period',
      label: 'Period',
      type: 'select' as const,
      value: 'last30days',
      options: [
        { label: 'Last 7 days', value: 'last7days' },
        { label: 'Last 30 days', value: 'last30days' },
        { label: 'Last 90 days', value: 'last90days' },
      ],
      onChange: (value: string) => console.log('Period changed:', value),
    },
  ];

  const viewControls = [
    { type: 'table' as const, active: viewType === 'table', onChange: setViewType },
    { type: 'cards' as const, active: viewType === 'cards', onChange: setViewType },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Event Analytics"
        subtitle="Comprehensive analytics for your events"
        breadcrumbs={breadcrumbs}
        actions={actions}
        tabs={tabs}
        filters={filters}
        viewControls={viewControls}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Content
          </h3>
          <p className="text-gray-500">
            This is the content for the {activeTab} tab in {viewType} view.
            {searchQuery && ` Searching for: "${searchQuery}"`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  ExampleServiceDashboard,
  ExampleResourceListPage,
  ExampleResourceDetailPage,
  ExamplePageHeader,
};