import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { UserRole } from '../../../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * EventServiceDashboard provides the AWS-style service landing page for Event Management.
 * Features:
 * - Service overview with key metrics
 * - Quick action buttons for common tasks
 * - Recent events and activity
 * - Service-specific widgets and analytics
 */
type DashboardEventRow = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
};

export const EventServiceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { createPath, listPath, eventDetailPath, eventEditPath } = useEventManagementPaths();

  useEffect(() => {
    document.title = 'Event Management Dashboard | Thittam1Hub';

    const description =
      'Manage your events, track registrations, and view recent activity in one place.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, []);

  const { data: events } = useQuery<DashboardEventRow[]>({
    queryKey: ['event-service-dashboard-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, start_date')
        .order('start_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as DashboardEventRow[];
    },
  });

  const { data: registrationsByEvent } = useQuery<Record<string, number>>({
    queryKey: ['event-service-dashboard-registrations', (events ?? []).map((e) => e.id)],
    enabled: !!events && events.length > 0,
    queryFn: async () => {
      const eventIds = (events ?? []).map((e) => e.id);
      const { data, error } = await supabase
        .from('registrations')
        .select('id, event_id')
        .in('event_id', eventIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data as { id: string; event_id: string }[]).forEach((row) => {
        counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const metrics = useMemo(() => {
    const allEvents = events ?? [];
    const totalEvents = allEvents.length;
    const activeEvents = allEvents.filter((evt) =>
      ['PUBLISHED', 'ONGOING'].includes(evt.status),
    ).length;
    const draftEvents = allEvents.filter((evt) => evt.status === 'DRAFT').length;
    const upcomingEvents = allEvents.filter((evt) => {
      if (!evt.start_date) return false;
      return new Date(evt.start_date).getTime() > Date.now();
    }).length;

    const totalRegistrations = Object.values(registrationsByEvent ?? {}).reduce(
      (sum, value) => sum + value,
      0,
    );

    return {
      totalEvents,
      activeEvents,
      draftEvents,
      totalRegistrations,
      upcomingEvents,
    };
  }, [events, registrationsByEvent]);

  const canManageEvents =
    user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORGANIZER;

  const quickActions = [
    {
      title: 'Create New Event',
      description: 'Start planning your next event',
      href: createPath,
      primary: true,
    },
    {
      title: 'Browse Templates',
      description: 'Use pre-built event templates',
      href: listPath.replace(/\/list$/, '/templates'),
    },
    {
      title: 'View All Events',
      description: 'Manage your existing events',
      href: listPath,
    },
    {
      title: 'Analytics Dashboard',
      description: 'View event performance metrics',
      href: listPath.replace(/\/list$/, '/analytics'),
    },
  ];

  const pageActions = [
    {
      label: 'Create Event',
      action: () => {
        window.location.href = createPath;
      },
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
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{metrics.totalEvents}</p>
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
                  <p className="text-xl sm:text-2xl font-bold text-emerald-500">{metrics.activeEvents}</p>
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
                  <p className="text-xl sm:text-2xl font-bold text-amber-500">{metrics.draftEvents}</p>
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
                  <p className="text-xl sm:text-2xl font-bold text-primary">{metrics.totalRegistrations}</p>
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
                  <p className="text-xl sm:text-2xl font-bold text-violet-500">{metrics.upcomingEvents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`block p-4 sm:p-6 rounded-lg border transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${{
                  true: action.primary
                    ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-card hover:bg-muted',
                }.true}`}
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
              </Link>
            ))}
          </div>
        </div>
 
        {/* Recent Events */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Recent Events</h3>
            <Link
              to={listPath}
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
                  {(events ?? []).map((event: DashboardEventRow) => (
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
                        {event.start_date ? new Date(event.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                        {registrationsByEvent?.[event.id] ?? 0}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild>
                                <Link to={eventDetailPath(event.id)} className="w-full">
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={eventEditPath(event.id)} className="w-full">
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {canManageEvents && (
                                <>
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={`/events/${event.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full"
                                    >
                                      Preview public page
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      to={listPath.replace(/\/list$/, `/${event.id}/page-builder`)}
                                      className="w-full"
                                    >
                                      Page Builder
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      to={listPath.replace(/\/list$/, `/${event.id}/ops`)}
                                      className="w-full"
                                    >
                                      Ops Console
                                    </Link>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
