/**
 * Sponsor Deliverables Hook - Database-backed deliverable tracking
 * Replaces mock data in DeliverableTracker component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type DeliverableStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type DeliverablePriority = 'low' | 'medium' | 'high';
export type DeliverableCategory = 'logo_placement' | 'social_post' | 'booth' | 'speaking_slot' | 'email_blast' | 'banner' | 'swag' | 'other';

export interface SponsorDeliverable {
  id: string;
  workspaceId: string;
  sponsorId: string;
  sponsorName: string;
  title: string;
  description: string | null;
  category: DeliverableCategory;
  status: DeliverableStatus;
  priority: DeliverablePriority;
  dueDate: string | null;
  completedAt: string | null;
  proofUrl: string | null;
  assignedTo: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverableInput {
  workspaceId: string;
  sponsorId: string;
  title: string;
  category: DeliverableCategory;
  description?: string;
  priority?: DeliverablePriority;
  dueDate?: string;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateDeliverableInput {
  title?: string;
  category?: DeliverableCategory;
  description?: string;
  status?: DeliverableStatus;
  priority?: DeliverablePriority;
  dueDate?: string;
  completedAt?: string;
  proofUrl?: string;
  assignedTo?: string;
  notes?: string;
}

// ============================================
// Helper Functions
// ============================================

function mapDeliverableFromDb(row: Record<string, unknown>, sponsorName?: string): SponsorDeliverable {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    sponsorId: row.sponsor_id as string,
    sponsorName: sponsorName || 'Unknown Sponsor',
    title: row.title as string,
    description: row.description as string | null,
    category: (row.category as DeliverableCategory) || 'other',
    status: (row.status as DeliverableStatus) || 'pending',
    priority: (row.priority as DeliverablePriority) || 'medium',
    dueDate: row.due_date as string | null,
    completedAt: row.completed_at as string | null,
    proofUrl: row.proof_url as string | null,
    assignedTo: row.assigned_to as string | null,
    notes: row.notes as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching deliverables for a workspace
 */
export function useSponsorDeliverables(workspaceId: string | undefined, sponsorId?: string) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.sponsorDeliverables(workspaceId || ''), sponsorId],
    queryFn: async (): Promise<SponsorDeliverable[]> => {
      if (!workspaceId) return [];

      let query = supabase
        .from('workspace_sponsor_deliverables')
        .select(`
          *,
          workspace_sponsors!inner(name)
        `)
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (sponsorId) {
        query = query.eq('sponsor_id', sponsorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map((row) => {
        const sponsor = row.workspace_sponsors as { name: string } | null;
        return mapDeliverableFromDb(row, sponsor?.name || 'Unknown');
      });
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for deliverable CRUD operations
 */
export function useDeliverableMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.sponsorDeliverables(workspaceId || '');

  const createDeliverable = useMutation({
    mutationFn: async (input: CreateDeliverableInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        workspace_id: input.workspaceId,
        sponsor_id: input.sponsorId,
        title: input.title,
        category: input.category,
        description: input.description ?? null,
        priority: input.priority ?? 'medium',
        due_date: input.dueDate,
        assigned_to: input.assignedTo ?? null,
        notes: input.notes ?? null,
        status: 'pending',
        created_by: userData?.user?.id ?? null,
      };
      
      const { data, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return mapDeliverableFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Deliverable created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, ...input }: UpdateDeliverableInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.completedAt !== undefined) updateData.completed_at = input.completedAt;
      if (input.proofUrl !== undefined) updateData.proof_url = input.proofUrl;
      if (input.assignedTo !== undefined) updateData.assigned_to = input.assignedTo;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { data, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDeliverableFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorDeliverable[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorDeliverable[] | undefined) =>
        old?.map((d) => (d.id === id ? { ...d, ...input } : d))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update deliverable: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Deliverable updated');
    },
  });

  const markComplete = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDeliverableFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Deliverable marked as complete');
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete deliverable: ${error.message}`);
    },
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_sponsor_deliverables')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorDeliverable[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorDeliverable[] | undefined) =>
        old?.filter((d) => d.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete deliverable: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Deliverable removed');
    },
  });

  return {
    createDeliverable,
    updateDeliverable,
    markComplete,
    deleteDeliverable,
  };
}

/**
 * Hook for deliverable statistics
 */
export function useDeliverableStats(workspaceId: string | undefined) {
  const { data: deliverables = [], isLoading } = useSponsorDeliverables(workspaceId);

  const now = new Date();
  
  const stats = {
    total: deliverables.length,
    pending: deliverables.filter((d) => d.status === 'pending').length,
    inProgress: deliverables.filter((d) => d.status === 'in_progress').length,
    completed: deliverables.filter((d) => d.status === 'completed').length,
    overdue: deliverables.filter((d) => {
      if (!d.dueDate || d.status === 'completed') return false;
      return new Date(d.dueDate) < now;
    }).length,
    dueSoon: deliverables.filter((d) => {
      if (!d.dueDate || d.status === 'completed') return false;
      const dueDate = new Date(d.dueDate);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    }).length,
  };

  return { stats, isLoading };
}