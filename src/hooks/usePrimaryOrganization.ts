import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from './useAuth';

interface PrimaryOrganization {
  organizationId: string;
  slug: string;
}

/**
 * Fetches the user's primary (first) organization membership.
 * Used for direct navigation after login to avoid redirect chains.
 */
export function usePrimaryOrganization() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['primary-organization', user?.id],
    queryFn: async (): Promise<PrimaryOrganization | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('organization_memberships')
        .select('organization_id, organizations!inner(slug)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        return null;
      }

      if (!data?.organizations) return null;

      const org = data.organizations as { slug: string };
      return {
        organizationId: data.organization_id,
        slug: org.slug,
      };
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - org rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Standalone function to fetch primary org (for use in login flow before React Query is available)
 */
export async function fetchPrimaryOrganizationForUser(userId: string): Promise<PrimaryOrganization | null> {
  const { data, error } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.organizations) {
    return null;
  }

  const org = data.organizations as { slug: string };
  return {
    organizationId: data.organization_id,
    slug: org.slug,
  };
}
