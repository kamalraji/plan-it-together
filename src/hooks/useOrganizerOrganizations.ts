import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OrganizerOrganizationRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  category: string;
  created_at: string;
}

export interface OrganizerEventRow {
  id: string;
  organization_id: string | null;
  status: string;
}

export interface OrganizerOrgMetrics {
  totalOrganizations: number;
  managedOrganizations: number;
  totalMembers: number;
  totalFollowers: number;
  activeEvents: number;
}

export interface RecentManagedOrganization {
  id: string;
  name: string;
  role: 'OWNER';
  memberCount: number;
  eventCount: number;
  followerCount: number;
}

export interface PerOrgAnalytics {
  [organizationId: string]: {
    totalEvents: number;
    draftEvents: number;
    publishedEvents: number;
    ongoingEvents: number;
    completedEvents: number;
  };
}

interface UseOrganizerOrganizationsResult {
  userId: string | null;
  organizations?: OrganizerOrganizationRow[];
  managedOrganizations: OrganizerOrganizationRow[];
  orgEvents?: OrganizerEventRow[];
  metrics: OrganizerOrgMetrics;
  recentOrganizations: RecentManagedOrganization[];
  perOrgAnalytics: PerOrgAnalytics;
  isLoadingOrganizations: boolean;
  isLoadingEvents: boolean;
  organizationsError: Error | null;
  eventsError: Error | null;
}

/**
 * Shared organizer-aware hook that centralizes Supabase fetching for
 * organizations + related events and derived metrics.
 */
export function useOrganizerOrganizations(): UseOrganizerOrganizationsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
    error: organizationsError,
  } = useQuery<OrganizerOrganizationRow[]>({
    queryKey: ['console-organizations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, owner_id, category, created_at');

      if (error) throw error;
      return data as OrganizerOrganizationRow[];
    },
  });

  const managedOrganizations = useMemo(
    () =>
      organizations && userId
        ? organizations.filter((org) => org.owner_id === userId)
        : [],
    [organizations, userId],
  );

  const {
    data: orgEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery<OrganizerEventRow[]>({
    queryKey: ['console-org-events', managedOrganizations.map((o) => o.id)],
    enabled: managedOrganizations.length > 0,
    queryFn: async () => {
      const orgIds = managedOrganizations.map((o) => o.id);
      const { data, error } = await supabase
        .from('events')
        .select('id, organization_id, status')
        .in('organization_id', orgIds);

      if (error) throw error;
      return data as unknown as OrganizerEventRow[];
    },
  });

  const metrics: OrganizerOrgMetrics = useMemo(() => {
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

  const recentOrganizations: RecentManagedOrganization[] = useMemo(
    () =>
      managedOrganizations
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5)
        .map((org) => {
          const eventCount = (orgEvents ?? []).filter(
            (evt) => evt.organization_id === org.id,
          ).length;
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

  const perOrgAnalytics: PerOrgAnalytics = useMemo(() => {
    const analytics: PerOrgAnalytics = {};

    (orgEvents ?? []).forEach((evt) => {
      if (!evt.organization_id) return;
      if (!analytics[evt.organization_id]) {
        analytics[evt.organization_id] = {
          totalEvents: 0,
          draftEvents: 0,
          publishedEvents: 0,
          ongoingEvents: 0,
          completedEvents: 0,
        };
      }

      const bucket = analytics[evt.organization_id];
      bucket.totalEvents += 1;
      switch (evt.status) {
        case 'DRAFT':
          bucket.draftEvents += 1;
          break;
        case 'PUBLISHED':
          bucket.publishedEvents += 1;
          break;
        case 'ONGOING':
          bucket.ongoingEvents += 1;
          break;
        case 'COMPLETED':
          bucket.completedEvents += 1;
          break;
      }
    });

    return analytics;
  }, [orgEvents]);

  return {
    userId,
    organizations,
    managedOrganizations,
    orgEvents,
    metrics,
    recentOrganizations,
    perOrgAnalytics,
    isLoadingOrganizations,
    isLoadingEvents,
    organizationsError: (organizationsError as Error) ?? null,
    eventsError: (eventsError as Error) ?? null,
  };
}
