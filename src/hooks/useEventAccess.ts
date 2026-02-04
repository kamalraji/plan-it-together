import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from './useAuth';

interface EventAccessResult {
  canView: boolean;
  canManage: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface EventAccessQueryResult {
  event: {
    id: string;
    owner_id: string;
    organization_id: string | null;
  } | null;
  membership: {
    status: string;
    role: string;
  } | null;
}

export function useEventAccess(eventId?: string): EventAccessResult {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data,
    isLoading: accessLoading,
    error,
  } = useQuery<EventAccessQueryResult>({
    queryKey: ['event-access', eventId, user?.id],
    enabled: !!eventId && !authLoading,
    queryFn: async () => {
      if (!eventId) {
        return { event: null, membership: null };
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, owner_id, organization_id')
        .eq('id', eventId)
        .maybeSingle();

      if (eventError) throw eventError;

      if (!event) {
        return { event: null, membership: null };
      }

      if (!user || !event.organization_id) {
        return { event, membership: null };
      }

      const { data: membership, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('status, role')
        .eq('user_id', user.id)
        .eq('organization_id', event.organization_id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      return { event, membership: membership ?? null };
    },
  });

  const isLoading = authLoading || accessLoading;

  if (isLoading) {
    return { canView: false, canManage: false, isLoading: true, error: null };
  }

  if (error) {
    return { canView: false, canManage: false, isLoading: false, error: error as Error };
  }

  const event = data?.event ?? null;
  const membership = data?.membership ?? null;

  const canView = !!event;

  const isOwner = !!user && !!event && event.owner_id === user.id;
  const isOrgAdmin =
    !!membership &&
    membership.status === 'ACTIVE' &&
    ['OWNER', 'ADMIN'].includes(membership.role);

  const canManage = !!user && (isOwner || isOrgAdmin);

  return { canView, canManage, isLoading: false, error: null };
}
