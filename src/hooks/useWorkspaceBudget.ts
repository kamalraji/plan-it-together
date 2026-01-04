import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkspaceBudget {
  id: string;
  workspace_id: string;
  allocated: number;
  used: number;
  currency: string;
  fiscal_year: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  name: string;
  allocated: number;
  used: number;
  created_at: string;
}

export interface BudgetRequest {
  id: string;
  requesting_workspace_id: string;
  target_workspace_id: string;
  requested_amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  requesting_workspace?: { name: string };
  target_workspace?: { name: string };
}

export function useWorkspaceBudget(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const budgetQuery = useQuery({
    queryKey: ['workspace-budget', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data, error } = await supabase
        .from('workspace_budgets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle();
      if (error) throw error;
      return data as WorkspaceBudget | null;
    },
    enabled: !!workspaceId,
  });

  const categoriesQuery = useQuery({
    queryKey: ['workspace-budget-categories', budgetQuery.data?.id],
    queryFn: async () => {
      if (!budgetQuery.data?.id) return [];
      const { data, error } = await supabase
        .from('workspace_budget_categories')
        .select('*')
        .eq('budget_id', budgetQuery.data.id);
      if (error) throw error;
      return data as BudgetCategory[];
    },
    enabled: !!budgetQuery.data?.id,
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (budget: Partial<WorkspaceBudget>) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      const { data, error } = await supabase
        .from('workspace_budgets')
        .insert({ workspace_id: workspaceId, allocated: budget.allocated ?? 0, used: budget.used ?? 0, currency: budget.currency ?? 'INR', fiscal_year: budget.fiscal_year })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-budget', workspaceId] });
      toast({ title: 'Budget created successfully' });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceBudget> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-budget', workspaceId] });
      toast({ title: 'Budget updated successfully' });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<BudgetCategory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('workspace_budget_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-budget-categories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_budget_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-budget-categories'] });
    },
  });

  return {
    budget: budgetQuery.data,
    categories: categoriesQuery.data ?? [],
    isLoading: budgetQuery.isLoading,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    addCategory: addCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
  };
}

export function useBudgetRequests(workspaceId: string | undefined, role: 'requester' | 'approver') {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requestsQuery = useQuery({
    queryKey: ['budget-requests', workspaceId, role],
    queryFn: async () => {
      if (!workspaceId) return [];
      const column = role === 'requester' ? 'requesting_workspace_id' : 'target_workspace_id';
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .select(`
          *,
          requesting_workspace:workspaces!workspace_budget_requests_requesting_workspace_id_fkey(name),
          target_workspace:workspaces!workspace_budget_requests_target_workspace_id_fkey(name)
        `)
        .eq(column, workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BudgetRequest[];
    },
    enabled: !!workspaceId,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (request: {
      requesting_workspace_id: string;
      target_workspace_id: string;
      requested_amount: number;
      reason: string;
      requested_by: string;
    }) => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .insert(request)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      toast({ title: 'Budget request submitted', description: 'Waiting for approval from department' });
    },
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reviewed_by,
      review_notes,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reviewed_by: string;
      review_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .update({
          status,
          reviewed_by,
          reviewed_at: new Date().toISOString(),
          review_notes,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // If approved, update the budget
      if (status === 'approved') {
        const request = data as BudgetRequest;
        // Get current budget for requesting workspace
        const { data: budget } = await supabase
          .from('workspace_budgets')
          .select('*')
          .eq('workspace_id', request.requesting_workspace_id)
          .maybeSingle();

        if (budget) {
          await supabase
            .from('workspace_budgets')
            .update({ allocated: budget.allocated + request.requested_amount })
            .eq('id', budget.id);
        } else {
          await supabase
            .from('workspace_budgets')
            .insert({
              workspace_id: request.requesting_workspace_id,
              allocated: request.requested_amount,
              used: 0,
            });
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-budget'] });
      toast({
        title: variables.status === 'approved' ? 'Request approved' : 'Request rejected',
        description: variables.status === 'approved'
          ? 'Budget has been allocated to the committee'
          : 'The budget request has been declined',
      });
    },
  });

  return {
    requests: requestsQuery.data ?? [],
    isLoading: requestsQuery.isLoading,
    createRequest: createRequestMutation.mutate,
    reviewRequest: reviewRequestMutation.mutate,
    isReviewing: reviewRequestMutation.isPending,
  };
}
