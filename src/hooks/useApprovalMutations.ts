import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { optimisticHelpers } from './useOptimisticMutation';

interface BudgetRequest {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface ResourceRequest {
  id: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Optimistic mutations for approval workflows
 * Provides instant UI feedback with automatic rollback on failure
 */
export function useApprovalMutations(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const budgetQueryKey = ['workspace-budget-requests', workspaceId];
  const resourceQueryKey = ['workspace-resource-requests', workspaceId];

  // Approve budget request with optimistic update
  const approveBudget = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('budget_requests')
        .update({ 
          status: 'APPROVED', 
          resolved_at: new Date().toISOString(),
          notes: notes || null 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: budgetQueryKey });
      const previousData = queryClient.getQueryData<BudgetRequest[]>(budgetQueryKey);
      
      if (previousData) {
        queryClient.setQueryData(
          budgetQueryKey,
          optimisticHelpers.updateInList(previousData, requestId, { status: 'APPROVED' })
        );
      }
      
      return { previousData };
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(budgetQueryKey, context.previousData);
      }
      toast({
        title: 'Failed to approve budget request',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Budget request approved' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey });
    },
  });

  // Reject budget request with optimistic update
  const rejectBudget = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('budget_requests')
        .update({ 
          status: 'REJECTED', 
          resolved_at: new Date().toISOString(),
          notes: reason 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: budgetQueryKey });
      const previousData = queryClient.getQueryData<BudgetRequest[]>(budgetQueryKey);
      
      if (previousData) {
        queryClient.setQueryData(
          budgetQueryKey,
          optimisticHelpers.updateInList(previousData, requestId, { status: 'REJECTED' })
        );
      }
      
      return { previousData };
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(budgetQueryKey, context.previousData);
      }
      toast({
        title: 'Failed to reject budget request',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Budget request rejected' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey });
    },
  });

  // Approve resource request with optimistic update
  const approveResource = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('resource_requests')
        .update({ 
          status: 'APPROVED', 
          resolved_at: new Date().toISOString(),
          notes: notes || null 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: resourceQueryKey });
      const previousData = queryClient.getQueryData<ResourceRequest[]>(resourceQueryKey);
      
      if (previousData) {
        queryClient.setQueryData(
          resourceQueryKey,
          optimisticHelpers.updateInList(previousData, requestId, { status: 'APPROVED' })
        );
      }
      
      return { previousData };
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(resourceQueryKey, context.previousData);
      }
      toast({
        title: 'Failed to approve resource request',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Resource request approved' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKey });
    },
  });

  // Reject resource request with optimistic update
  const rejectResource = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('resource_requests')
        .update({ 
          status: 'REJECTED', 
          resolved_at: new Date().toISOString(),
          notes: reason 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: resourceQueryKey });
      const previousData = queryClient.getQueryData<ResourceRequest[]>(resourceQueryKey);
      
      if (previousData) {
        queryClient.setQueryData(
          resourceQueryKey,
          optimisticHelpers.updateInList(previousData, requestId, { status: 'REJECTED' })
        );
      }
      
      return { previousData };
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(resourceQueryKey, context.previousData);
      }
      toast({
        title: 'Failed to reject resource request',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Resource request rejected' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKey });
    },
  });

  // Bulk approve registrations
  const bulkApproveRegistrations = useMutation({
    mutationFn: async (registrationIds: string[]) => {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'CONFIRMED' })
        .in('id', registrationIds);

      if (error) throw error;
      return registrationIds;
    },
    onSuccess: (ids) => {
      toast({ title: `${ids.length} registration(s) approved` });
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to approve registrations',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    approveBudget,
    rejectBudget,
    approveResource,
    rejectResource,
    bulkApproveRegistrations,
  };
}
