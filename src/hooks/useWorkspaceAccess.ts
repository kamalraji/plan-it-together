import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WorkspaceAccessResult {
  canView: boolean;
  canManage: boolean;
  isOwner: boolean;
  isMember: boolean;
  memberRole?: string;
  isLoading: boolean;
  error: Error | null;
}

interface WorkspaceAccessQueryResult {
  workspace: {
    id: string;
    organizer_id: string;
  } | null;
  membership: {
    role: string;
    status: string;
  } | null;
}

export function useWorkspaceAccess(workspaceId?: string): WorkspaceAccessResult {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data,
    isLoading: accessLoading,
    error,
  } = useQuery<WorkspaceAccessQueryResult>({
    queryKey: ['workspace-access', workspaceId, user?.id],
    enabled: !!workspaceId && !authLoading,
    queryFn: async () => {
      if (!workspaceId) {
        return { workspace: null, membership: null };
      }

      // Fetch workspace info
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, organizer_id')
        .eq('id', workspaceId)
        .maybeSingle();

      if (workspaceError) throw workspaceError;

      // Fetch team membership if user is logged in
      let membership = null;
      if (user) {
        const { data: memberData } = await supabase
          .from('workspace_team_members')
          .select('role, status')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .maybeSingle();
        
        membership = memberData ?? null;
      }

      return { workspace: workspace ?? null, membership };
    },
  });

  const isLoading = authLoading || accessLoading;

  if (isLoading) {
    return { canView: false, canManage: false, isOwner: false, isMember: false, isLoading: true, error: null };
  }

  if (error) {
    return { canView: false, canManage: false, isOwner: false, isMember: false, isLoading: false, error: error as Error };
  }

  const workspace = data?.workspace ?? null;
  const membership = data?.membership ?? null;

  const isOwner = !!user && !!workspace && workspace.organizer_id === user.id;
  const isMember = !!membership && membership.status === 'ACTIVE';

  // Can view if owner OR active member
  const canView = !!workspace && (isOwner || isMember);
  
  // Can manage only if owner
  const canManage = isOwner;

  return { 
    canView, 
    canManage, 
    isOwner, 
    isMember, 
    memberRole: membership?.role,
    isLoading: false, 
    error: null 
  };
}
