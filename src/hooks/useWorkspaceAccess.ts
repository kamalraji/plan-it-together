import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WorkspaceAccessResult {
  canView: boolean;
  canManage: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface WorkspaceAccessQueryResult {
  workspace: {
    id: string;
    organizer_id: string;
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
        return { workspace: null };
      }

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, organizer_id')
        .eq('id', workspaceId)
        .maybeSingle();

      if (workspaceError) throw workspaceError;

      return { workspace: workspace ?? null };
    },
  });

  const isLoading = authLoading || accessLoading;

  if (isLoading) {
    return { canView: false, canManage: false, isLoading: true, error: null };
  }

  if (error) {
    return { canView: false, canManage: false, isLoading: false, error: error as Error };
  }

  const workspace = data?.workspace ?? null;

  const canView = !!workspace;
  const isOwner = !!user && !!workspace && workspace.organizer_id === user.id;

  const canManage = !!user && isOwner;

  return { canView, canManage, isLoading: false, error: null };
}
