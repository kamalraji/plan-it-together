import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface ApprovalDelegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  workspace_id: string;
  start_date: string;
  end_date: string | null;
  reason: string | null;
  is_active: boolean;
  created_at: string;
  delegate_name?: string;
  delegate_email?: string;
}

interface CreateDelegationInput {
  workspaceId: string;
  delegateId: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}

/**
 * Hook for managing approval delegation (Out of Office / Deputy approvals)
 * Follows industrial standards for approval workflow management
 */
export function useApprovalDelegation(workspaceId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's active delegations
  const { data: myDelegations, isLoading: loadingMyDelegations } = useQuery({
    queryKey: ['approval-delegations', workspaceId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('approval_delegations')
        .select(`
          *,
          delegate:delegate_id(id, email, full_name)
        `)
        .eq('delegator_id', user.id)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        ...d,
        delegate_name: d.delegate?.full_name || 'Unknown',
        delegate_email: d.delegate?.email || '',
      })) as ApprovalDelegation[];
    },
    enabled: !!user?.id && !!workspaceId,
  });

  // Fetch delegations where current user is the delegate
  const { data: delegatedToMe, isLoading: loadingDelegatedToMe } = useQuery({
    queryKey: ['delegated-approvals', workspaceId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('approval_delegations')
        .select(`
          *,
          delegator:delegator_id(id, email, full_name)
        `)
        .eq('delegate_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        ...d,
        delegator_name: d.delegator?.full_name || 'Unknown',
        delegator_email: d.delegator?.email || '',
      }));
    },
    enabled: !!user?.id && !!workspaceId,
  });

  // Create new delegation
  const createDelegationMutation = useMutation({
    mutationFn: async (input: CreateDelegationInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Deactivate any existing active delegations for same workspace
      await supabase
        .from('approval_delegations')
        .update({ is_active: false })
        .eq('delegator_id', user.id)
        .eq('workspace_id', input.workspaceId)
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('approval_delegations')
        .insert({
          delegator_id: user.id,
          delegate_id: input.delegateId,
          workspace_id: input.workspaceId,
          start_date: input.startDate,
          end_date: input.endDate || null,
          reason: input.reason || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-delegations', workspaceId] });
      toast({
        title: 'Delegation created',
        description: 'Your approvals will be handled by your delegate.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating delegation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Revoke/deactivate a delegation
  const revokeDelegationMutation = useMutation({
    mutationFn: async (delegationId: string) => {
      const { error } = await supabase
        .from('approval_delegations')
        .update({ is_active: false, end_date: new Date().toISOString() })
        .eq('id', delegationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-delegations', workspaceId] });
      toast({
        title: 'Delegation revoked',
        description: 'You will now receive approval requests directly.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error revoking delegation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Check if user has active delegation (OOO mode)
  const hasActiveDelegation = myDelegations?.some((d) => {
    if (!d.is_active) return false;
    const now = new Date();
    const start = new Date(d.start_date);
    const end = d.end_date ? new Date(d.end_date) : null;
    return now >= start && (!end || now <= end);
  }) ?? false;

  // Check if user is acting as delegate for someone
  const actingAsDelegate = delegatedToMe?.filter((d) => {
    const now = new Date();
    const start = new Date(d.start_date);
    const end = d.end_date ? new Date(d.end_date) : null;
    return now >= start && (!end || now <= end);
  }) ?? [];

  return {
    // Data
    myDelegations: myDelegations ?? [],
    delegatedToMe: delegatedToMe ?? [],
    hasActiveDelegation,
    actingAsDelegate,

    // Loading states
    isLoading: loadingMyDelegations || loadingDelegatedToMe,
    isCreating: createDelegationMutation.isPending,
    isRevoking: revokeDelegationMutation.isPending,

    // Actions
    createDelegation: (input: Omit<CreateDelegationInput, 'workspaceId'>) =>
      createDelegationMutation.mutateAsync({ ...input, workspaceId }),
    revokeDelegation: revokeDelegationMutation.mutateAsync,
  };
}
