import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isPast, parseISO } from 'date-fns';

export type DelegationStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface DelegatedChecklistWithProgress {
  id: string;
  title: string;
  phase: string | null;
  due_date: string | null;
  delegation_status: string | null;
  delegated_at: string | null;
  items: { id: string; text: string; completed: boolean }[];
  workspace_id: string;
  workspace_name: string;
  workspace_type: string;
  // Computed
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  computedStatus: DelegationStatus;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface DelegationProgressStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  averageProgress: number;
}

export function useDelegationProgress(workspaceId: string | undefined) {
  const delegationsQuery = useQuery({
    queryKey: ['delegation-progress', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      // Fetch all checklists delegated FROM this workspace
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select(`
          id,
          title,
          phase,
          due_date,
          delegation_status,
          delegated_at,
          items,
          workspace_id,
          workspaces!workspace_checklists_workspace_id_fkey (
            name,
            workspace_type
          )
        `)
        .eq('delegated_from_workspace_id', workspaceId)
        .order('delegated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((checklist: any) => {
        const items = (checklist.items || []) as { id: string; text: string; completed: boolean }[];
        const totalItems = items.length;
        const completedItems = items.filter(i => i.completed).length;
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Compute status
        let computedStatus: DelegationStatus = 'pending';
        let isOverdue = false;
        let daysOverdue = 0;

        if (progressPercentage === 100) {
          computedStatus = 'completed';
        } else if (progressPercentage > 0) {
          computedStatus = 'in_progress';
        }

        // Check if overdue
        if (checklist.due_date && computedStatus !== 'completed') {
          const dueDate = parseISO(checklist.due_date);
          if (isPast(dueDate)) {
            isOverdue = true;
            computedStatus = 'overdue';
            daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        return {
          id: checklist.id,
          title: checklist.title,
          phase: checklist.phase,
          due_date: checklist.due_date,
          delegation_status: checklist.delegation_status,
          delegated_at: checklist.delegated_at,
          items,
          workspace_id: checklist.workspace_id,
          workspace_name: checklist.workspaces?.name || 'Unknown',
          workspace_type: checklist.workspaces?.workspace_type || 'UNKNOWN',
          totalItems,
          completedItems,
          progressPercentage,
          computedStatus,
          isOverdue,
          daysOverdue,
        } as DelegatedChecklistWithProgress;
      });
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const delegations = delegationsQuery.data ?? [];
  const stats: DelegationProgressStats = {
    total: delegations.length,
    pending: delegations.filter(d => d.computedStatus === 'pending').length,
    inProgress: delegations.filter(d => d.computedStatus === 'in_progress').length,
    completed: delegations.filter(d => d.computedStatus === 'completed').length,
    overdue: delegations.filter(d => d.computedStatus === 'overdue').length,
    averageProgress: delegations.length > 0 
      ? Math.round(delegations.reduce((sum, d) => sum + d.progressPercentage, 0) / delegations.length)
      : 0,
  };

  return {
    delegations,
    stats,
    isLoading: delegationsQuery.isLoading,
    refetch: delegationsQuery.refetch,
  };
}
