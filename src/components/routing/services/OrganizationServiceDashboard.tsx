import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  category: string;
  created_at: string;
}

interface EventRow {
  id: string;
  organization_id: string | null;
  status: string;
}

/**
 * OrganizationServiceDashboard provides the AWS-style service landing page for Organization Management.
 * It uses real Supabase data for the current organizer's organizations and related metrics.
 */
export const OrganizationServiceDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: organizations, isLoading } = useQuery<OrganizationRow[]>({
    queryKey: ['console-organizations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, owner_id, category, created_at');

      if (error) throw error;
      return data as OrganizationRow[];
    },
  });

  const managedOrganizations = useMemo(
    () => (organizations && user ? organizations.filter((org) => org.owner_id === user.id) : []),
    [organizations, user],
  );

  const { data: orgEvents } = useQuery<EventRow[]>({
    queryKey: ['console-org-events', managedOrganizations.map((o) => o.id)],
    enabled: managedOrganizations.length > 0,
    queryFn: async () => {
      const orgIds = managedOrganizations.map((o) => o.id);
      const { data, error } = await supabase
        .from('events')
        .select('id, organization_id, status')
        .in('organization_id', orgIds);

      if (error) throw error;
      return data as unknown as EventRow[];
    },
  });

  const metrics = useMemo(() => {
    const totalOrganizations = organizations?.length ?? 0;
    const managedCount = managedOrganizations.length;

    const activeEvents = (orgEvents ?? []).filter((evt) =>
      ['PUBLISHED', 'ONGOING'].includes(evt.status),
    ).length;

    return {
      totalOrganizations,
      managedOrganizations: managedCount,
      totalMembers: 0,
      totalFollowers: 0,
      activeEvents,
    };
  }, [organizations, managedOrganizations, orgEvents]);

  const recentOrganizations = useMemo(
    () =>
      managedOrganizations
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((org) => {
          const eventCount = (orgEvents ?? []).filter((evt) => evt.organization_id === org.id).length;
          return {
            id: org.id,
            name: org.name,
            role: 'OWNER' as const,
            memberCount: 0,
            eventCount,
            followerCount: 0,
          };
        }),
    [managedOrganizations, orgEvents],
  );

  interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: string;
    primary?: boolean;
  }

  const quickActions: QuickAction[] = [
    {
      title: 'Manage Members',
      description: 'Add, remove, and manage organization members',
      href: '/dashboard/organizations/list',
      icon: '👥',
      primary: true,
    },
    {
      title: 'Organization Settings',
      description: 'Configure branding and organization settings',
      href: '/dashboard/organizations/list',
      icon: '⚙️',
    },
    {
      title: 'View Analytics',
      description: 'Monitor organization performance and growth',
      href: '/dashboard/analytics',
      icon: '📊',
    },
    {
      title: 'Multi-Org Management',
      description: 'Manage multiple organizations',
      href: '/dashboard/organizations/multi-org',
      icon: '🏢',
    },
  ];

  const pageActions = [
    {
      label: 'Manage Organizations',
      action: () => {
        window.location.href = '/dashboard/organizations/list';
      },
      variant: 'primary' as const,
    },
    {
      label: 'View Analytics',
      action: () => {
        window.location.href = '/dashboard/analytics';
      },
      variant: 'secondary' as const,
    },
  ];

  if (isLoading && !organizations) {
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

        {/* Service Overview Metrics */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🏢</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Organizations</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{metrics.totalOrganizations}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👑</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Managed Organizations</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{metrics.managedOrganizations}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👥</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{metrics.totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">❤️</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Followers</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{metrics.totalFollowers}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{metrics.activeEvents}</p>
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
                className={`block p-4 sm:p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  action.primary
                    ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-card hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl">{action.icon}</span>
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

        {/* Recent Organizations */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Your Organizations</h3>
            <Link
              to="/console/organizations/list"
              className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all organizations →
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
                    {recentOrganizations.map((org) => (
                      <tr key={org.id} className="hover:bg-muted/60">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{org.name}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span
                            className="inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
                          >
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
                            to={`/console/organizations/${org.id}`}
                            className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                          >
                            View
                          </Link>
                          <Link
                            to={`/console/organizations/${org.id}/members`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6 text-xs sm:text-sm text-muted-foreground">
              You don't own any organizations yet. Create one from the Organizations console to start managing
              teams.
            </div>
          )}
        </div>

        {/* Service Information */}
        <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">About Organization Management Service</h3>
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
