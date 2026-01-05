import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';
import { useCreateOrganization } from '@/hooks/useOrganization';
import { UserRole } from '../../../types';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: string;
  primary?: boolean;
}

/**
 * OrganizationServiceDashboard provides the AWS-style service landing page for Organization Management.
 * It uses shared organizer-aware Supabase hooks for the current organizer's organizations and metrics.
 */
export const OrganizationServiceDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    organizations,
    managedOrganizations,
    metrics,
    recentOrganizations,
    perOrgAnalytics,
    isLoadingOrganizations,
  } = useOrganizerOrganizations();

  const { toast } = useToast();
  const createOrganization = useCreateOrganization();

  const [newOrgName, setNewOrgName] = React.useState('');
  const [newOrgSlug, setNewOrgSlug] = React.useState('');
  const [newOrgCategory, setNewOrgCategory] = React.useState<
    'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT'
  >('COMPANY');

  const [transferOrgId, setTransferOrgId] = React.useState<string>('');
  const [transferTargetUserId, setTransferTargetUserId] = React.useState<string>('');

  const isOrganizer =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const handleNameChange = (value: string) => {
    setNewOrgName(value);
    if (!newOrgSlug) {
      const slugFromName = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setNewOrgSlug(slugFromName);
    }
  };

  const handleCreateOrganization = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newOrgName.trim()) {
      toast({ title: 'Organization name is required', variant: 'destructive' });
      return;
    }

    const slug = (newOrgSlug || newOrgName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    try {
      await createOrganization.mutateAsync({
        name: newOrgName.trim(),
        slug,
        category: newOrgCategory,
      });
      setNewOrgName('');
      setNewOrgSlug('');
    } catch (error: any) {
      toast({
        title: 'Failed to create organization',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTransferOwnership = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transferOrgId || !transferTargetUserId) {
      toast({
        title: 'Select organization and target owner',
        description: 'Both organization and target user ID are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ owner_id: transferTargetUserId })
        .eq('id', transferOrgId);

      if (error) throw error;

      toast({
        title: 'Ownership updated',
        description: 'Organization ownership has been transferred.',
      });

      setTransferOrgId('');
      setTransferTargetUserId('');
    } catch (error: any) {
      toast({
        title: 'Failed to transfer ownership',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const quickActions: QuickAction[] = [
    {
      title: 'Manage Members',
      description: 'Add, remove, and manage organization members',
      href: getOrgPath('/team'),
      icon: '👥',
      primary: true,
    },
    {
      title: 'Organization Settings',
      description: 'Configure branding and organization settings',
      href: getOrgPath('/settings'),
      icon: '⚙️',
    },
    {
      title: 'View Analytics',
      description: 'Monitor organization performance and growth',
      href: getOrgPath('/analytics'),
      icon: '📊',
    },
    {
      title: 'Create New Organization',
      description: 'Set up a new organization',
      href: '/organizations/create',
      icon: '🏢',
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

        {/* Service Overview Metrics */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🏢</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Organizations
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {metrics.totalOrganizations}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👑</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Managed Organizations
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    {metrics.managedOrganizations}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👥</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Members
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {metrics.totalMembers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">❤️</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Followers
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {metrics.totalFollowers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Active Events
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {metrics.activeEvents}
                  </p>
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

        {/* Organizer-only tools: inline creation + ownership transfer */}
        {isOrganizer && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Inline organization creation */}
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                Create organization inline
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Quickly spin up a new organization without leaving the console. You will become the
                owner of the organization.
              </p>
              <form onSubmit={handleCreateOrganization} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-muted-foreground">
                    Organization name
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Tech Innovation Hub"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-muted-foreground">
                    URL slug
                  </label>
                  <input
                    type="text"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="auto-generated-from-name"
                  />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    This controls URLs like <code className="font-mono">/your-slug/organizations</code>.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <select
                    value={newOrgCategory}
                    onChange={(e) =>
                      setNewOrgCategory(
                        e.target.value as 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT',
                      )
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="COMPANY">Company</option>
                    <option value="COLLEGE">College</option>
                    <option value="INDUSTRY">Industry</option>
                    <option value="NON_PROFIT">Non-profit</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Create organization
                </button>
              </form>
            </div>

            {/* Ownership transfer */}
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                Transfer organization ownership
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Move ownership of an organization to another user. You must provide the target
                user's Supabase user ID, and you will retain access through member/admin roles.
              </p>
              <form onSubmit={handleTransferOwnership} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-muted-foreground">
                    Organization
                  </label>
                  <select
                    value={transferOrgId}
                    onChange={(e) => setTransferOrgId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select organization</option>
                    {managedOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-muted-foreground">
                    Target owner user ID
                  </label>
                  <input
                    type="text"
                    value={transferTargetUserId}
                    onChange={(e) => setTransferTargetUserId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Supabase auth user UUID"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md border border-destructive/40 bg-background px-3 py-2 text-xs sm:text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Transfer ownership
                </button>
              </form>
            </div>
          </div>
        )}

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
        {isOrganizer && managedOrganizations.length > 0 && (
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
