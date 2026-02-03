import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MyWorkspace {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  workspace_type: string | null;
  event_id: string;
  organizer_id: string;
  parent_workspace_id: string | null;
  created_at: string;
  isOwner: boolean;
  role?: string;
}

export function useMyWorkspaces(eventId?: string) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['my-workspaces', user?.id, eventId],
    enabled: !!user && !authLoading,
    queryFn: async (): Promise<MyWorkspace[]> => {
      if (!user) return [];

      // Get workspaces where user is owner
      let ownedQuery = supabase
        .from('workspaces')
        .select('id, name, slug, status, workspace_type, event_id, organizer_id, parent_workspace_id, created_at')
        .eq('organizer_id', user.id);

      if (eventId) {
        ownedQuery = ownedQuery.eq('event_id', eventId);
      }

      const { data: ownedWorkspaces, error: ownedError } = await ownedQuery;

      if (ownedError) {
        throw ownedError;
      }

      // Get workspaces where user is a team member
      let memberQuery = supabase
        .from('workspace_team_members')
        .select(`
          workspace_id,
          role,
          workspaces:workspace_id (
            id, name, slug, status, workspace_type, event_id, organizer_id, parent_workspace_id, created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE');

      const { data: memberWorkspaces, error: memberError } = await memberQuery;

      if (memberError) {
        throw memberError;
      }

      // Combine and deduplicate
      const workspaceMap = new Map<string, MyWorkspace>();

      // Add owned workspaces
      (ownedWorkspaces || []).forEach(ws => {
        if (!eventId || ws.event_id === eventId) {
          workspaceMap.set(ws.id, {
            ...ws,
            isOwner: true,
          });
        }
      });

      // Add member workspaces (if not already owner)
      (memberWorkspaces || []).forEach(m => {
        // Type-safe extraction of joined workspace data
        const ws = m.workspaces as {
          id: string;
          name: string;
          slug: string | null;
          status: string;
          workspace_type: string | null;
          event_id: string;
          organizer_id: string;
          parent_workspace_id: string | null;
          created_at: string;
        } | null;
        if (ws && (!eventId || ws.event_id === eventId) && !workspaceMap.has(ws.id)) {
          workspaceMap.set(ws.id, {
            ...ws,
            isOwner: false,
            role: m.role ?? undefined,
          });
        }
      });

      return Array.from(workspaceMap.values());
    },
  });
}
