import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentOrganization } from './OrganizationContext';
import {
  useMyOrganizationMemberships,
  useOrganizationAnalytics,
  useOrganizationEvents,
} from '@/hooks/useOrganization';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UsersIcon, TrophyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { OrganizationReportExport } from './OrganizationReportExport';

export const OrgScopedAnalyticsPage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { data: memberships, isLoading: membershipsLoading } = useMyOrganizationMemberships();
  const { data: analytics, isLoading: analyticsLoading } = useOrganizationAnalytics(organization?.id);
  const { data: events, isLoading: eventsLoading } = useOrganizationEvents(organization?.id!);

  const isLoading = membershipsLoading || analyticsLoading || eventsLoading;

  const activeMembership = useMemo(() => {
    if (!memberships || !organization) return undefined;

    return memberships.find((m: any) =>
      m.organization_id === organization.id &&
      m.status === 'ACTIVE' &&
      (m.role === 'OWNER' || m.role === 'ADMIN'),
    );
  }, [memberships, organization]);

  if (!organization) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-xl font-semibold">Organization not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't load this organization. Try returning to your dashboard and selecting it again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!activeMembership) {
    return (
      <div className="space-y-4 py-10 text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          You must be an owner or admin of {organization.name} to view analytics. Contact an org
          admin if you believe this is a mistake.
        </p>
        <Button asChild variant="outline">
          <Link to={`/${organization.slug}`}>Back to organization overview</Link>
        </Button>
      </div>
    );
  }

  const totalEvents = events?.length ?? 0;
  const activeEventsCount = analytics?.activeEvents ?? 0;
  const completedEventsCount = events?.filter((e: any) => e.status === 'COMPLETED').length ?? 0;
  const totalRegistrations = analytics?.totalRegistrations ?? 0;
  const followerCount = analytics?.followerCount ?? 0;
  const avgRegistrations = totalEvents ? Math.round(totalRegistrations / totalEvents) : 0;

  const topEvents = useMemo(() => {
    if (!events || events.length === 0) return [] as any[];

    return [...events]
      .sort((a: any, b: any) => {
        const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
        const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [events]);

  const recentEvents = useMemo(() => {
    if (!events || events.length === 0) return [] as any[];

    return [...events]
      .sort((a: any, b: any) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [events]);

  const statCards = [
    { title: 'Total events', value: totalEvents, icon: CalendarIcon },
    { title: 'Active events', value: activeEventsCount, icon: TrophyIcon },
    { title: 'Total participants', value: totalRegistrations, icon: UsersIcon },
    { title: 'Completed events', value: completedEventsCount, icon: CheckCircleIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <OrganizationBreadcrumbs
          items={[
            {
              label: organization.name ?? 'Organization',
              href: organization.slug ? `/${organization.slug}` : undefined,
              icon: (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {organization.name?.charAt(0).toUpperCase()}
                </span>
              ),
            },
            {
              label: 'Analytics',
              isCurrent: true,
            },
          ]}
          className="text-xs"
        />
        <h2 className="text-xl font-bold sm:text-2xl">Organization analytics</h2>
        <p className="text-sm text-muted-foreground">
          Performance metrics, top events, and recent activity for {organization.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold sm:text-base">Quick insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average registrations per event</span>
                <span className="font-medium">{avgRegistrations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">{followerCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active vs completed events</span>
                <span className="font-medium">
                  {activeEventsCount} active · {completedEventsCount} completed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold sm:text-base">Top events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {topEvents.length === 0 && (
                <p className="text-muted-foreground">No events yet. Create an event to start seeing performance.</p>
              )}
              {topEvents.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBA'} · {event.status}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/${organization.slug}/events/${event.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold sm:text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentEvents.length === 0 && (
                <p className="text-muted-foreground">No recent activity yet.</p>
              )}
              {recentEvents.map((event: any) => (
                <div key={event.id} className="space-y-0.5">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'recently'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold sm:text-base">Export report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Download a CSV or PDF summary of your organization analytics for offline analysis and
                sharing.
              </p>
              <OrganizationReportExport organizationId={organization.id} showProgress />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold sm:text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Use active and completed events to understand how your programs perform over time.</p>
              <p>Track followers and registrations to measure marketing impact across campaigns.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
