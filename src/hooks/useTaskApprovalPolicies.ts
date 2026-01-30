import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskApprovalPolicy, ApprovalPolicyFormData, ApprovalLevel } from '@/lib/taskApprovalTypes';
import { TaskCategory, TaskPriority, WorkspaceRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook for managing task approval policies
 */
export function useTaskApprovalPolicies(workspaceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all policies for a workspace
  const {
    data: policies = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['task-approval-policies', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('task_approval_policies')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(mapPolicyFromDb);
    },
    enabled: !!workspaceId,
  });

  // Create a new policy
  const createPolicyMutation = useMutation({
    mutationFn: async (formData: ApprovalPolicyFormData) => {
      if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');

      const { data, error } = await supabase
        .from('task_approval_policies')
        .insert({
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description,
          applies_to_categories: formData.appliesToCategories,
          applies_to_priorities: formData.appliesToPriorities,
          applies_to_role_scopes: formData.appliesToRoleScopes,
          min_estimated_hours: formData.minEstimatedHours,
          is_default: formData.isDefault,
          approval_chain: JSON.stringify(formData.approvalChain),
          require_all_levels: formData.requireAllLevels,
          allow_self_approval: formData.allowSelfApproval,
          auto_approve_after_hours: formData.autoApproveAfterHours,
          is_enabled: formData.isEnabled,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapPolicyFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-policies', workspaceId] });
      toast.success('Approval policy created');
    },
    onError: (_error) => {
      toast.error('Failed to create approval policy');
    },
  });

  // Update a policy
  const updatePolicyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ApprovalPolicyFormData> }) => {
      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.appliesToCategories !== undefined) updateData.applies_to_categories = updates.appliesToCategories;
      if (updates.appliesToPriorities !== undefined) updateData.applies_to_priorities = updates.appliesToPriorities;
      if (updates.appliesToRoleScopes !== undefined) updateData.applies_to_role_scopes = updates.appliesToRoleScopes;
      if (updates.minEstimatedHours !== undefined) updateData.min_estimated_hours = updates.minEstimatedHours;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
      if (updates.approvalChain !== undefined) updateData.approval_chain = JSON.stringify(updates.approvalChain);
      if (updates.requireAllLevels !== undefined) updateData.require_all_levels = updates.requireAllLevels;
      if (updates.allowSelfApproval !== undefined) updateData.allow_self_approval = updates.allowSelfApproval;
      if (updates.autoApproveAfterHours !== undefined) updateData.auto_approve_after_hours = updates.autoApproveAfterHours;
      if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled;

      const { data, error } = await supabase
        .from('task_approval_policies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPolicyFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-policies', workspaceId] });
      toast.success('Approval policy updated');
    },
    onError: (_error) => {
      toast.error('Failed to update approval policy');
    },
  });

  // Delete a policy
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_approval_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-policies', workspaceId] });
      toast.success('Approval policy deleted');
    },
    onError: (_error) => {
      toast.error('Failed to delete approval policy');
    },
  });

  // Toggle policy enabled state
  const togglePolicyMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from('task_approval_policies')
        .update({ is_enabled: isEnabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isEnabled }) => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-policies', workspaceId] });
      toast.success(isEnabled ? 'Policy enabled' : 'Policy disabled');
    },
    onError: (_error) => {
      toast.error('Failed to update policy');
    },
  });

  return {
    policies,
    isLoading,
    error,
    refetch,
    createPolicy: createPolicyMutation.mutateAsync,
    updatePolicy: updatePolicyMutation.mutateAsync,
    deletePolicy: deletePolicyMutation.mutateAsync,
    togglePolicy: togglePolicyMutation.mutateAsync,
    isCreating: createPolicyMutation.isPending,
    isUpdating: updatePolicyMutation.isPending,
    isDeleting: deletePolicyMutation.isPending,
  };
}

/**
 * Map database row to TaskApprovalPolicy
 */
function mapPolicyFromDb(row: Record<string, unknown>): TaskApprovalPolicy {
  let approvalChain: ApprovalLevel[] = [];
  
  try {
    const chainData = row.approval_chain;
    if (typeof chainData === 'string') {
      approvalChain = JSON.parse(chainData);
    } else if (Array.isArray(chainData)) {
      approvalChain = chainData as ApprovalLevel[];
    }
  } catch {
    // Failed to parse approval chain - use empty default
  }

  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    appliesToCategories: (row.applies_to_categories as TaskCategory[] | null) || undefined,
    appliesToPriorities: (row.applies_to_priorities as TaskPriority[] | null) || undefined,
    appliesToRoleScopes: (row.applies_to_role_scopes as WorkspaceRole[] | null) || undefined,
    minEstimatedHours: row.min_estimated_hours as number | undefined,
    isDefault: row.is_default as boolean,
    approvalChain,
    requireAllLevels: row.require_all_levels as boolean,
    allowSelfApproval: row.allow_self_approval as boolean,
    autoApproveAfterHours: row.auto_approve_after_hours as number | undefined,
    isEnabled: row.is_enabled as boolean,
    createdBy: row.created_by as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
