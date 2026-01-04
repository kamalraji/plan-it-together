import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useEventManagementMetrics, DashboardEventRow } from '@/hooks/useEventManagementMetrics';
import { OrganizerBreadcrumbs } from '@/components/organization/OrganizerBreadcrumbs';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
import { useOptionalOrganization } from '@/components/organization/OrganizationContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const organization = useOptionalOrganization();
  const [onlyMine, setOnlyMine] = useState(false);
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

  const { events, registrationsByEvent } = useEventManagementMetrics(organization?.id, onlyMine);


  const pageActions = [
    {
      label: 'Create Event',
      action: () => {
        window.location.href = createPath;
      },
      variant: 'primary' as const,
    },
  ];

  return (
    <OrgPageWrapper>
      <OrganizerBreadcrumbs current="event-management" />
      <div className="space-y-6 sm:space-y-8">
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

          {/* Ownership Toggle - only show in org context */}
          {organization?.id && (
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 sm:p-4">
              <Switch
                id="only-mine-toggle"
                checked={onlyMine}
                onCheckedChange={setOnlyMine}
              />
              <Label htmlFor="only-mine-toggle" className="text-sm text-muted-foreground cursor-pointer">
                Show only my created events
              </Label>
            </div>
          )}

          {/* Recent Events */}
          <section aria-labelledby="event-service-recent-events-heading" className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
              <h2
                id="event-service-recent-events-heading"
                className="text-base sm:text-lg font-medium text-foreground"
              >
                Recent Events
              </h2>
              <Link
                to={listPath}
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
              >
                View all events →
              </Link>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {(events ?? []).map((event: DashboardEventRow) => (
                <div key={event.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">{event.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'No date set'}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex px-2 py-1 text-[11px] font-semibold rounded-full ${
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
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{registrationsByEvent?.[event.id] ?? 0}</span>
                    <span className="ml-1">registrations</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Link
                      to={eventDetailPath(event.id)}
                      className="text-xs font-medium text-primary hover:text-primary/80 px-2 py-1 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      to={eventEditPath(event.id)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/events/${event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:text-primary/80 px-2 py-1 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      Preview
                    </Link>
                    <Link
                      to={listPath.replace(/\/list$/, `/${event.id}/page-builder`)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                    >
                      Page Builder
                    </Link>
                  </div>
                </div>
              ))}
              {(events ?? []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No events yet. Create your first event!
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
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
                          <Link
                            to={eventDetailPath(event.id)}
                            className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                          >
                            View
                          </Link>
                          <Link
                            to={eventEditPath(event.id)}
                            className="text-muted-foreground hover:text-foreground mr-3 sm:mr-4"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/events/${event.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                          >
                            Preview public page
                          </Link>
                          <Link
                            to={listPath.replace(/\/list$/, `/${event.id}/page-builder`)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Page Builder
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Service Information */}
          <section aria-labelledby="event-service-about-heading" className="bg-primary/5 rounded-lg p-4 sm:p-6">
            <h2
              id="event-service-about-heading"
              className="text-base sm:text-lg font-medium text-primary mb-2"
            >
              About Event Management Service
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              The Event Management Service provides comprehensive tools for creating, managing, and analyzing events.
              From initial planning to post-event analytics, manage your entire event lifecycle in one place.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <h3 className="font-medium text-foreground mb-1">Event Creation</h3>
                <p className="text-muted-foreground">
                  Create events with customizable templates, branding, and registration forms.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Registration Management</h3>
                <p className="text-muted-foreground">
                  Handle participant registration, waitlists, and communication.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Analytics &amp; Insights</h3>
                <p className="text-muted-foreground">
                  Track event performance, attendance, and participant engagement.
                </p>
              </div>
            </div>
          </section>
        </div>
    </OrgPageWrapper>
  );
};
