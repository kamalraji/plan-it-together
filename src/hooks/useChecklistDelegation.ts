import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Checklist, ChecklistItem } from '@/hooks/useCommitteeDashboard';

export interface DelegatedChecklist extends Checklist {
  delegated_from_workspace_id: string | null;
  delegated_by: string | null;
  delegated_at: string | null;
  due_date: string | null;
  delegation_status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  source_workspace?: {
    id: string;
    name: string;
  };
}

interface DelegateChecklistParams {
  checklistId: string;
  targetWorkspaceId: string;
  dueDate: Date | null;
}

export function useChecklistDelegation(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch delegated checklists (checklists delegated TO this workspace)
  const delegatedChecklistsQuery = useQuery({
    queryKey: ['delegated-checklists', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      // First get the delegated checklists
      const { data: checklists, error } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('workspace_id', workspaceId)
        .not('delegated_from_workspace_id', 'is', null)
        .order('due_date', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      if (!checklists || checklists.length === 0) return [];

      // Get source workspace names
      const sourceWorkspaceIds = [...new Set(checklists.map(c => c.delegated_from_workspace_id).filter((id): id is string => id !== null))];
      const { data: sourceWorkspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .in('id', sourceWorkspaceIds);

      const workspaceMap = new Map(sourceWorkspaces?.map(w => [w.id, w]) || []);
      
      return checklists.map(c => ({
        ...c,
        items: (Array.isArray(c.items) ? c.items : []) as unknown as ChecklistItem[],
        source_workspace: c.delegated_from_workspace_id ? workspaceMap.get(c.delegated_from_workspace_id) || null : null,
      })) as DelegatedChecklist[];
    },
    enabled: !!workspaceId,
  });

  // Fetch checklists delegated FROM this workspace to children
  const outgoingDelegationsQuery = useQuery({
    queryKey: ['outgoing-delegations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      // First get the outgoing delegations
      const { data: checklists, error } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('delegated_from_workspace_id', workspaceId)
        .order('delegated_at', { ascending: false });
      
      if (error) throw error;
      if (!checklists || checklists.length === 0) return [];

      // Get target workspace info
      const targetWorkspaceIds = [...new Set(checklists.map(c => c.workspace_id))];
      const { data: targetWorkspaces } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type')
        .in('id', targetWorkspaceIds);

      const workspaceMap = new Map(targetWorkspaces?.map(w => [w.id, w]) || []);
      
      return checklists.map(c => ({
        ...c,
        items: (Array.isArray(c.items) ? c.items : []) as unknown as ChecklistItem[],
        target_workspace: workspaceMap.get(c.workspace_id) || null,
      }));
    },
    enabled: !!workspaceId,
  });

  // Delegate a checklist to a child workspace
  const delegateMutation = useMutation({
    mutationFn: async ({ checklistId, targetWorkspaceId, dueDate }: DelegateChecklistParams) => {
      if (!user?.id) throw new Error('Must be authenticated');

      // First, get the original checklist
      const { data: originalChecklist, error: fetchError } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('id', checklistId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalChecklist) throw new Error('Checklist not found');

      // Create a copy of the checklist in the target workspace with delegation info
      const { data: delegatedChecklist, error: insertError } = await supabase
        .from('workspace_checklists')
        .insert({
          workspace_id: targetWorkspaceId,
          title: originalChecklist.title,
          committee_type: originalChecklist.committee_type,
          phase: originalChecklist.phase,
          items: originalChecklist.items,
          is_template: false,
          delegated_from_workspace_id: originalChecklist.workspace_id,
          delegated_by: user.id,
          delegated_at: new Date().toISOString(),
          due_date: dueDate?.toISOString() || null,
          delegation_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return delegatedChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['delegated-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-delegations'] });
      toast({ title: 'Checklist delegated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delegate checklist', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update delegation status
  const updateDelegationStatusMutation = useMutation({
    mutationFn: async ({ checklistId, status }: { checklistId: string; status: string }) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .update({ delegation_status: status })
        .eq('id', checklistId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['delegated-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-delegations'] });
    },
  });

  return {
    delegatedChecklists: delegatedChecklistsQuery.data ?? [],
    outgoingDelegations: outgoingDelegationsQuery.data ?? [],
    isLoadingDelegated: delegatedChecklistsQuery.isLoading,
    isLoadingOutgoing: outgoingDelegationsQuery.isLoading,
    delegateChecklist: delegateMutation.mutate,
    isDelegating: delegateMutation.isPending,
    updateDelegationStatus: updateDelegationStatusMutation.mutate,
  };
}
