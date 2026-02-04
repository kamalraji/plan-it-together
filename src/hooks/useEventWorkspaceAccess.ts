import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to check if the current user has any workspace team membership for a given event.
 * This replaces the deprecated UserRole.VOLUNTEER check for event access.
 */
export function useEventWorkspaceAccess(eventId?: string) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: hasAccess = false, isLoading: accessLoading } = useQuery({
    queryKey: ['event-workspace-access', eventId, user?.id],
    enabled: !!eventId && !!user?.id && !authLoading,
    queryFn: async () => {
      if (!eventId || !user?.id) return false;

      // Find workspaces associated with this event
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('event_id', eventId);

      if (wsError || !workspaces?.length) return false;

      // Check if user is a team member in any of these workspaces
      const workspaceIds = workspaces.map(w => w.id);
      const { data: membership, error: memberError } = await supabase
        .from('workspace_team_members')
        .select('id')
        .in('workspace_id', workspaceIds)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .limit(1)
        .maybeSingle();

      if (memberError) return false;

      return !!membership;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasWorkspaceAccess: hasAccess,
    isLoading: authLoading || accessLoading,
  };
}
