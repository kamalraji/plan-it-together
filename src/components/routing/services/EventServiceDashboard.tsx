import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { useEventCreatePath } from '@/hooks/useEventCreatePath';

/**
 * EventServiceDashboard provides the AWS-style service landing page for Event Management.
 * Features:
 * - Service overview with key metrics
 * - Quick action buttons for common tasks
 * - Recent events and activity
 * - Service-specific widgets and analytics
 */
export const EventServiceDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in real implementation, this would come from API
  const dashboardData = {
    metrics: {
      totalEvents: 12,
      activeEvents: 3,
      draftEvents: 2,
      totalRegistrations: 1247,
      upcomingEvents: 5,
    },
    recentEvents: [
      {
        id: '1',
        name: 'Tech Innovation Summit 2024',
        status: 'PUBLISHED',
        startDate: '2024-03-15',
        registrations: 156,
      },
      {
        id: '2',
        name: 'AI Workshop Series',
        status: 'DRAFT',
        startDate: '2024-03-20',
        registrations: 0,
      },
      {
        id: '3',
        name: 'Startup Pitch Competition',
        status: 'ONGOING',
        startDate: '2024-02-28',
        registrations: 89,
      },
    ],
    quickActions: [
      {
        title: 'Create New Event',
        description: 'Start planning your next event',
        href: '/console/events/create',
        primary: true,
      },
      {
        title: 'Browse Templates',
        description: 'Use pre-built event templates',
        href: '/console/events/templates',
      },
      {
        title: 'View All Events',
        description: 'Manage your existing events',
        href: '/console/events/list',
      },
      {
        title: 'Analytics Dashboard',
        description: 'View event performance metrics',
        href: '/console/analytics',
      },
    ],
  };

  const createEventPath = useEventCreatePath();

  const pageActions = [
    {
      label: 'Create Event',
      action: () => { window.location.href = createEventPath; },
      variant: 'primary' as const,
    },
    {
      label: 'Import Events',
      action: () => console.log('Import events'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Event Management"
          subtitle="Create, manage, and analyze your events"
          actions={pageActions}
        />
 
        {/* Welcome Message */}
        {user && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 text-xs sm:text-sm">
            <p className="text-primary">
              Welcome back, <span className="font-semibold">{user.name}</span>! Ready to manage your
              events?
            </p>
          </div>
        )}
 
        {/* Service Overview Metrics */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-semibold">
                    EV
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalEvents}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs sm:text-sm font-semibold">
                    AC
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-500">{dashboardData.metrics.activeEvents}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs sm:text-sm font-semibold">
                    DR
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Draft Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-500">{dashboardData.metrics.draftEvents}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-semibold">
                    RG
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Registrations</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{dashboardData.metrics.totalRegistrations}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs sm:text-sm font-semibold">
                    UP
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Upcoming Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-violet-500">{dashboardData.metrics.upcomingEvents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {dashboardData.quickActions.map((action, index) => (
              <div
                key={index}
                className={`block p-4 sm:p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  action.primary
                    ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-card hover:bg-muted'
                }`}
              >
                <div className="flex items-center mb-2 sm:mb-3">
                  <h4
                    className={`text-sm sm:text-base font-medium ${
                      action.primary ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {action.title}
                  </h4>
                </div>
                <p
                  className={`text-xs sm:text-sm ${
                    action.primary ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
 
        {/* Recent Events */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Recent Events</h3>
            <Link
              to="/console/events/list"
              className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all events →
            </Link>
          </div>
 
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Registrations
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {dashboardData.recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/60">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{event.name}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full ${
                            event.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : event.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800'
                                : event.status === 'ONGOING'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                        {event.registrations}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <Link
                          to={`/console/events/${event.id}`}
                          className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                        >
                          View
                        </Link>
                        <Link
                          to={`/console/events/${event.id}/edit`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
 
        {/* Service Information */}
        <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">
            About Event Management Service
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            The Event Management Service provides comprehensive tools for creating, managing, and analyzing events.
            From initial planning to post-event analytics, manage your entire event lifecycle in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Event Creation</h4>
              <p className="text-muted-foreground">
                Create events with customizable templates, branding, and registration forms.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Registration Management</h4>
              <p className="text-muted-foreground">
                Handle participant registration, waitlists, and communication.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Analytics &amp; Insights</h4>
              <p className="text-muted-foreground">
                Track event performance, attendance, and participant engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
