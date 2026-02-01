import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryPresets } from '@/lib/query-config';

export interface WorkspaceExpense {
  id: string;
  workspace_id: string;
  description: string;
  amount: number;
  category: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  'Venue',
  'Catering',
  'Marketing',
  'Travel',
  'Equipment',
  'Supplies',
  'Printing',
  'Entertainment',
  'Technology',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export function useWorkspaceExpenses(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const expensesQuery = useQuery({
    queryKey: ['workspace-expenses', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_expenses')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WorkspaceExpense[];
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: {
      description: string;
      amount: number;
      category: string;
      notes?: string;
      receipt_url?: string;
    }) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workspace_expenses')
        .insert({
          workspace_id: workspaceId,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          notes: expense.notes || null,
          receipt_url: expense.receipt_url || null,
          submitted_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-expenses', workspaceId] });
      toast({ title: 'Expense recorded', description: 'Your expense has been submitted for approval.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateExpenseStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'approved' | 'rejected';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workspace_expenses')
        .update({
          status,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // If approved, update the workspace budget 'used' amount
      if (status === 'approved' && data) {
        const expense = data as WorkspaceExpense;
        const { data: budget } = await supabase
          .from('workspace_budgets')
          .select('id, used')
          .eq('workspace_id', expense.workspace_id)
          .maybeSingle();

        if (budget) {
          await supabase
            .from('workspace_budgets')
            .update({ used: budget.used + expense.amount })
            .eq('id', budget.id);
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-expenses', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-budget', workspaceId] });
      toast({
        title: variables.status === 'approved' ? 'Expense approved' : 'Expense rejected',
        description: variables.status === 'approved'
          ? 'The expense has been approved and budget updated.'
          : 'The expense has been rejected.',
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-expenses', workspaceId] });
      toast({ title: 'Expense deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Get expense statistics
  const stats = expensesQuery.data?.reduce(
    (acc, expense) => {
      acc.total += Number(expense.amount);
      if (expense.status === 'pending') {
        acc.pending += Number(expense.amount);
        acc.pendingCount++;
      } else if (expense.status === 'approved') {
        acc.approved += Number(expense.amount);
      } else if (expense.status === 'rejected') {
        acc.rejected += Number(expense.amount);
      }
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, pendingCount: 0 }
  ) ?? { total: 0, pending: 0, approved: 0, rejected: 0, pendingCount: 0 };

  return {
    expenses: expensesQuery.data ?? [],
    stats,
    isLoading: expensesQuery.isLoading,
    createExpense: createExpenseMutation.mutate,
    isCreating: createExpenseMutation.isPending,
    updateExpenseStatus: updateExpenseStatusMutation.mutate,
    isUpdating: updateExpenseStatusMutation.isPending,
    deleteExpense: deleteExpenseMutation.mutate,
  };
}
