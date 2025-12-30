# AWS-Style Page Components

This directory contains AWS Console-inspired page components and layouts for building enterprise-grade interfaces.

## Components Overview

### 1. PageHeader
A consistent page-level header component with breadcrumbs, actions, tabs, filters, and view controls.

**Features:**
- Breadcrumb navigation
- Primary and secondary action buttons
- Tab navigation with badges
- Filter controls (search, select, date, toggle)
- View type switchers (table, cards, list)
- Custom content area

**Usage:**
```tsx
import { PageHeader } from './components/routing';

<PageHeader
  title="Event Analytics"
  subtitle="Comprehensive analytics for your events"
  breadcrumbs={[
    { label: 'Dashboard', href: '/console' },
    { label: 'Events', current: true },
  ]}
  actions={[
    {
      label: 'Create Event',
      action: () => handleCreate(),
      variant: 'primary',
      icon: PlusIcon,
    },
  ]}
  tabs={[
    { id: 'overview', label: 'Overview', current: true },
    { id: 'settings', label: 'Settings', current: false },
  ]}
/>
```

### 2. ResourceListPage
A comprehensive table-based interface for managing collections of resources with filtering, sorting, pagination, and bulk actions.

**Features:**
- Sortable and filterable columns
- Search functionality
- Bulk selection and actions
- Pagination
- Multiple view types (table, cards, list)
- Row click handlers
- Loading and empty states

**Usage:**
```tsx
import { ResourceListPage } from './components/routing';

<ResourceListPage
  title="Events"
  subtitle="Manage your events"
  resourceType="Event"
  data={events}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ]}
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'active' },
      ],
    },
  ]}
  bulkActions={[
    {
      label: 'Publish',
      action: (items) => handlePublish(items),
      variant: 'primary',
    },
  ]}
  onCreateNew={() => handleCreate()}
  onRowClick={(item) => navigate(`/events/${item.id}`)}
/>
```

### 3. ResourceDetailPage
A detailed interface for viewing and managing individual resources with tabbed content and contextual actions.

**Features:**
- Tabbed content areas
- Resource-specific actions
- Breadcrumb navigation
- Loading and error states
- Action confirmation dialogs
- Badge support on tabs

**Usage:**
```tsx
import { ResourceDetailPage, OverviewTab, SettingsTab } from './components/routing';

<ResourceDetailPage
  title="Tech Conference 2024"
  subtitle="Annual technology conference"
  resourceId="1"
  resourceType="Event"
  breadcrumbs={[
    { label: 'Events', href: '/events' },
    { label: 'Tech Conference 2024', current: true },
  ]}
  tabs={[
    {
      id: 'overview',
      label: 'Overview',
      component: OverviewTab,
      props: { data: eventData },
    },
    {
      id: 'settings',
      label: 'Settings',
      component: SettingsTab,
      badge: '3',
    },
  ]}
  actions={[
    {
      label: 'Edit',
      action: () => handleEdit(),
      variant: 'primary',
      icon: PencilIcon,
    },
    {
      label: 'Delete',
      action: () => handleDelete(),
      variant: 'danger',
      confirmationRequired: true,
    },
  ]}
/>
```

### 4. ServiceDashboard
A customizable dashboard component with widgets, metrics, and quick actions for service landing pages.

**Features:**
- Multiple widget types (metric, chart, table, list, status, quickAction)
- Flexible grid layout
- Quick action cards
- Widget refresh functionality
- Loading states
- Customizable layouts

**Widget Types:**
- **Metric**: Display key metrics with trend indicators
- **Chart**: Placeholder for chart visualizations
- **Table**: Tabular data display
- **List**: Simple list of items
- **Status**: System status indicators
- **QuickAction**: Action buttons

**Usage:**
```tsx
import { ServiceDashboard } from './components/routing';

<ServiceDashboard
  service="Event Management"
  widgets={[
    {
      id: 'total-events',
      type: 'metric',
      title: 'Total Events',
      size: 'small',
      data: {
        value: '24',
        change: '+12%',
        changeType: 'increase',
        label: 'This month',
      },
    },
    {
      id: 'recent-events',
      type: 'list',
      title: 'Recent Events',
      size: 'medium',
      data: {
        items: [
          { label: 'Tech Conference', value: 'Tomorrow' },
          { label: 'Workshop', value: 'Next Week' },
        ],
      },
    },
  ]}
  quickActions={[
    {
      label: 'Create Event',
      description: 'Start a new event',
      icon: PlusIcon,
      action: () => handleCreate(),
      variant: 'primary',
    },
  ]}
  onRefresh={() => refreshData()}
  onCustomizeLayout={() => openCustomizer()}
/>
```

## Design Principles

These components follow AWS Console design patterns:

1. **Consistency**: All components share common visual language and interaction patterns
2. **Hierarchy**: Clear information hierarchy with proper spacing and typography
3. **Responsiveness**: Mobile-first design with adaptive layouts
4. **Accessibility**: WCAG AA compliant with proper ARIA labels
5. **Performance**: Optimized rendering with proper memoization
6. **Flexibility**: Highly configurable while maintaining consistency

## Component Composition

These components are designed to work together:

```tsx
// Service Dashboard (landing page)
<ServiceDashboard service="Events" widgets={widgets} />

// Resource List (collection view)
<ResourceListPage 
  title="Events" 
  data={events} 
  columns={columns}
  onRowClick={(event) => navigate(`/events/${event.id}`)}
/>

// Resource Detail (individual view)
<ResourceDetailPage
  title={event.name}
  resourceId={event.id}
  tabs={tabs}
  actions={actions}
/>
```

## Styling

All components use Tailwind CSS for styling and follow the application's design system:
- Primary color: Indigo (indigo-600)
- Success: Green (green-600)
- Warning: Yellow (yellow-600)
- Danger: Red (red-600)
- Neutral: Gray scale

## Examples

See `ExampleUsage.tsx` for complete working examples of all components.

## Integration with Existing Components

These AWS-style components are designed to wrap and compose existing feature components:

```tsx
// Wrap existing EventForm in ResourceDetailPage
<ResourceDetailPage
  title="Create Event"
  tabs={[
    {
      id: 'details',
      label: 'Event Details',
      component: EventForm, // Existing component
    },
  ]}
/>

// Use existing components in ServiceDashboard widgets
<ServiceDashboard
  widgets={[
    {
      id: 'analytics',
      type: 'chart',
      component: AnalyticsDashboard, // Existing component
    },
  ]}
/>
```

## Future Enhancements

Planned improvements:
- Drag-and-drop widget customization
- Advanced filtering with saved filters
- Export functionality for tables
- Real-time data updates
- Keyboard shortcuts
- Dark mode support
