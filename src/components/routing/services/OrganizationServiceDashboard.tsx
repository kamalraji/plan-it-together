import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';

/**
 * OrganizationServiceDashboard provides the AWS-style service landing page for Organization Management.
 * It uses shared organizer-aware Supabase hooks for the current organizer's organizations and metrics.
 */
export const OrganizationServiceDashboard: React.FC = () => {
  const {
    organizations,
    managedOrganizations,
    recentOrganizations,
    perOrgAnalytics,
    isLoadingOrganizations,
  } = useOrganizerOrganizations();

  // Get primary organization slug for org-scoped navigation
  const primaryOrgSlug = organizations && organizations.length > 0 ? organizations[0].slug : null;
  const getOrgPath = (path: string) => primaryOrgSlug ? `/${primaryOrgSlug}${path}` : '/dashboard/organizations/join';

  const pageActions = [
    {
      label: 'Manage Organizations',
      action: () => {
        window.location.href = getOrgPath('/settings');
      },
      variant: 'primary' as const,
    },
    {
      label: 'View Analytics',
      action: () => {
        window.location.href = getOrgPath('/analytics');
      },
      variant: 'secondary' as const,
    },
  ];

  if (isLoadingOrganizations && !organizations) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <PageHeader
            title="Organization Management"
            subtitle="Manage your organizations, members, and settings"
            actions={pageActions}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-lg border border-border p-4 sm:p-6 animate-pulse space-y-3"
              >
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Organization Management"
          subtitle="Manage your organizations, members, and settings"
          actions={pageActions}
        />

        {/* Recent Organizations */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Your Organizations</h3>
            <Link
              to={primaryOrgSlug ? `/${primaryOrgSlug}/settings` : '/organizations/create'}
              className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
            >
              Manage organization →
            </Link>
          </div>

          {recentOrganizations.length > 0 ? (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Organization Name
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Your Role
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Events
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Followers
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {recentOrganizations.map((org) => {
                      const matchedOrg = organizations?.find((o) => o.id === org.id);
                      const orgSlug = matchedOrg?.slug;
                      const dashboardPath = orgSlug ? `/${orgSlug}/dashboard` : '/dashboard';
                      const teamPath = orgSlug ? `/${orgSlug}/team` : '/dashboard/organizations/join';

                      return (
                        <tr key={org.id} className="hover:bg-muted/60">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">{org.name}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {org.role}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                            {org.memberCount}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                            {org.eventCount}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                            {org.followerCount}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <Link
                              to={dashboardPath}
                              className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                            >
                              View
                            </Link>
                            <Link
                              to={teamPath}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6 text-xs sm:text-sm text-muted-foreground">
              You don't own any organizations yet. Use the inline creation tool above to create your
              first organization.
            </div>
          )}
        </div>

        {/* Per-organization analytics panels */}
        {managedOrganizations.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Organization analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {managedOrganizations.map((org) => {
                const analytics = perOrgAnalytics[org.id] ?? {
                  totalEvents: 0,
                  draftEvents: 0,
                  publishedEvents: 0,
                  ongoingEvents: 0,
                  completedEvents: 0,
                };

                return (
                  <div
                    key={org.id}
                    className="bg-card rounded-lg border border-border p-4 sm:p-6 flex flex-col gap-2 sm:gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-medium text-foreground">
                          {org.name}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          {org.slug} · {org.category}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-primary">
                        {analytics.totalEvents} events
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Draft</span>
                        <span className="text-foreground font-medium">
                          {analytics.draftEvents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Published</span>
                        <span className="text-foreground font-medium">
                          {analytics.publishedEvents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Ongoing</span>
                        <span className="text-foreground font-medium">
                          {analytics.ongoingEvents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Completed</span>
                        <span className="text-foreground font-medium">
                          {analytics.completedEvents}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Information */}
        <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">
            About Organization Management Service
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            The Organization Management Service provides comprehensive tools for managing your organizations,
            members, and organizational settings. Oversee multiple organizations, track analytics, and
            configure branding and policies from one centralized location.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Member Management</h4>
              <p className="text-muted-foreground">
                Invite, manage, and assign roles to organization members with granular permissions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Organization Settings</h4>
              <p className="text-muted-foreground">
                Configure branding, policies, and organizational preferences.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Analytics &amp; Insights</h4>
              <p className="text-muted-foreground">
                Track organization growth, member activity, and event performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationServiceDashboard;
