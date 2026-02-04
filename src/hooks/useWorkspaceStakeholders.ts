/**
 * Workspace Stakeholders Hook
 * Manages key stakeholders (VIPs, media, sponsors, partners, government contacts)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StakeholderCategory = 'vip' | 'media' | 'sponsor' | 'partner' | 'government';
export type StakeholderPriority = 'high' | 'medium' | 'low';

export interface Stakeholder {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone?: string;
  category: StakeholderCategory;
  priority: StakeholderPriority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStakeholderInput {
  name: string;
  role: string;
  organization: string;
  email: string;
  phone?: string;
  category: StakeholderCategory;
  priority: StakeholderPriority;
  notes?: string;
}

export function useWorkspaceStakeholders(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['workspace-stakeholders', workspaceId];

  // Fetch stakeholders
  const { data: stakeholders = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<Stakeholder[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_stakeholders')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map((s) => ({
        id: s.id,
        workspaceId: s.workspace_id,
        name: s.name,
        role: s.role || '',
        organization: s.organization || '',
        email: s.email || '',
        phone: s.phone || undefined,
        category: s.category as StakeholderCategory,
        priority: s.priority as StakeholderPriority,
        notes: s.notes || undefined,
        createdAt: s.created_at || new Date().toISOString(),
        updatedAt: s.updated_at || new Date().toISOString(),
      }));
    },
    enabled: !!workspaceId,
  });

  // Create stakeholder
  const createMutation = useMutation({
    mutationFn: async (input: CreateStakeholderInput) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('workspace_stakeholders')
        .insert({
          workspace_id: workspaceId,
          name: input.name,
          role: input.role,
          organization: input.organization,
          email: input.email,
          phone: input.phone || null,
          category: input.category,
          priority: input.priority,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Stakeholder added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add stakeholder');
    },
  });

  // Update stakeholder
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Stakeholder> & { id: string }) => {
      const { error } = await supabase
        .from('workspace_stakeholders')
        .update({
          name: updates.name,
          role: updates.role,
          organization: updates.organization,
          email: updates.email,
          phone: updates.phone || null,
          category: updates.category,
          priority: updates.priority,
          notes: updates.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Stakeholder updated');
    },
    onError: () => {
      toast.error('Failed to update stakeholder');
    },
  });

  // Delete stakeholder
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_stakeholders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Stakeholder[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: Stakeholder[] = []) =>
        old.filter((s) => s.id !== id)
      );
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Failed to delete stakeholder');
    },
    onSuccess: () => {
      toast.success('Stakeholder removed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Stats by category
  const statsByCategory = stakeholders.reduce(
    (acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    },
    {} as Record<StakeholderCategory, number>
  );

  const highPriorityCount = stakeholders.filter((s) => s.priority === 'high').length;

  return {
    stakeholders,
    isLoading,
    error,
    statsByCategory,
    highPriorityCount,
    totalCount: stakeholders.length,
    createStakeholder: (input: CreateStakeholderInput) => createMutation.mutate(input),
    updateStakeholder: (data: Partial<Stakeholder> & { id: string }) => updateMutation.mutate(data),
    deleteStakeholder: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
