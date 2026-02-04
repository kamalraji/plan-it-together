import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryPresets } from '@/lib/query-config';

export interface ChildWorkspaceMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  workspaceId: string;
  workspaceName: string;
  workspaceType: string | null;
  role: string;
  path: string[]; // Hierarchy path from current workspace
}

interface UseChildWorkspaceMembersOptions {
  workspaceId: string;
  eventId?: string;
}

export function useChildWorkspaceMembers({ workspaceId, eventId }: UseChildWorkspaceMembersOptions) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['child-workspace-members', workspaceId, eventId],
    enabled: !!user && !authLoading && !!workspaceId,
    ...queryPresets.standard,
    queryFn: async (): Promise<ChildWorkspaceMember[]> => {
      if (!workspaceId) return [];

      // First get all workspaces for this event to build hierarchy
      const { data: allWorkspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, parent_workspace_id')
        .eq(eventId ? 'event_id' : 'id', eventId || workspaceId);

      if (wsError) {
        console.error('Error fetching workspaces:', wsError);
        throw wsError;
      }

      if (!allWorkspaces?.length) return [];

      // Build workspace tree to find children
      const workspaceMap = new Map(allWorkspaces.map(w => [w.id, w]));
      
      // Find all child workspace IDs recursively
      const findChildIds = (parentId: string, visited = new Set<string>()): string[] => {
        if (visited.has(parentId)) return [];
        visited.add(parentId);
        
        const children = allWorkspaces.filter(w => w.parent_workspace_id === parentId);
        const childIds: string[] = [];
        
        for (const child of children) {
          childIds.push(child.id);
          childIds.push(...findChildIds(child.id, visited));
        }
        
        return childIds;
      };

      const childWorkspaceIds = findChildIds(workspaceId);
      
      if (childWorkspaceIds.length === 0) return [];

      // Get team members from child workspaces
      const { data: teamMembers, error: tmError } = await supabase
        .from('workspace_team_members')
        .select('user_id, role, workspace_id')
        .in('workspace_id', childWorkspaceIds)
        .eq('status', 'ACTIVE');

      if (tmError) {
        console.error('Error fetching team members:', tmError);
        throw tmError;
      }

      if (!teamMembers?.length) return [];

      // Get unique user IDs
      const userIds = [...new Set(teamMembers.map(m => m.user_id))];

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Build hierarchy path for each workspace
      const buildPath = (wsId: string): string[] => {
        const path: string[] = [];
        let current = workspaceMap.get(wsId);
        
        while (current && current.id !== workspaceId) {
          path.unshift(current.name);
          if (current.parent_workspace_id) {
            current = workspaceMap.get(current.parent_workspace_id);
          } else {
            break;
          }
        }
        
        return path;
      };

      // Build result
      const result: ChildWorkspaceMember[] = teamMembers.map(tm => {
        const profile = profiles?.find(p => p.id === tm.user_id);
        const workspace = workspaceMap.get(tm.workspace_id);

        return {
          userId: tm.user_id,
          fullName: profile?.full_name || 'Unknown',
          avatarUrl: profile?.avatar_url || null,
          workspaceId: tm.workspace_id,
          workspaceName: workspace?.name || 'Unknown',
          workspaceType: workspace?.workspace_type || null,
          role: tm.role,
          path: buildPath(tm.workspace_id),
        };
      });

      // Sort by workspace path then name
      return result.sort((a, b) => {
        const pathCompare = a.path.join('/').localeCompare(b.path.join('/'));
        if (pathCompare !== 0) return pathCompare;
        return a.fullName.localeCompare(b.fullName);
      });
    },
  });
}
