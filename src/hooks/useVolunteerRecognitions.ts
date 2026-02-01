/**
 * Volunteer Recognitions Hook - Database-backed recognition management
 * Replaces mock data in RecognitionTab component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type RecognitionType = 'kudos' | 'star' | 'award' | 'milestone';

export interface Recognition {
  id: string;
  workspaceId: string;
  volunteerId: string;
  type: RecognitionType;
  title: string;
  description: string | null;
  awardedBy: string | null;
  awardedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateRecognitionInput {
  workspaceId: string;
  volunteerId: string;
  type: RecognitionType;
  title: string;
  description?: string;
}

// ============================================
// Helper Functions
// ============================================

function mapRecognitionFromDb(row: Record<string, unknown>): Recognition {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    volunteerId: row.volunteer_id as string,
    type: (row.recognition_type as RecognitionType) || 'kudos',
    title: row.title as string,
    description: row.description as string | null,
    awardedBy: row.awarded_by as string | null,
    awardedAt: row.awarded_at as string | null,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.created_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching recognitions for a workspace
 */
export function useVolunteerRecognitions(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.volunteerRecognitions(workspaceId || ''),
    queryFn: async (): Promise<Recognition[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('volunteer_recognitions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRecognitionFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

/**
 * Hook for recognition mutations
 */
export function useRecognitionMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.volunteerRecognitions(workspaceId || '');

  const createRecognition = useMutation({
    mutationFn: async (input: CreateRecognitionInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await supabase
        .from('volunteer_recognitions')
        .insert({
          workspace_id: input.workspaceId,
          volunteer_id: input.volunteerId,
          recognition_type: input.type,
          title: input.title,
          description: input.description || null,
          awarded_by: userId || null,
          awarded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return mapRecognitionFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Recognition given! 🎉');
    },
    onError: (error: Error) => {
      toast.error(`Failed to give recognition: ${error.message}`);
    },
  });

  const deleteRecognition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('volunteer_recognitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Recognition[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Recognition[] | undefined) =>
        old?.filter((r) => r.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete recognition: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Recognition removed');
    },
  });

  return {
    createRecognition,
    deleteRecognition,
  };
}

/**
 * Hook for recognition statistics
 */
export function useRecognitionStats(workspaceId: string | undefined) {
  const { data: recognitions = [], isLoading } = useVolunteerRecognitions(workspaceId);

  const stats = {
    total: recognitions.length,
    kudos: recognitions.filter((r) => r.type === 'kudos').length,
    stars: recognitions.filter((r) => r.type === 'star').length,
    awards: recognitions.filter((r) => r.type === 'award').length,
    milestones: recognitions.filter((r) => r.type === 'milestone').length,
    thisWeek: recognitions.filter((r) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(r.createdAt) >= weekAgo;
    }).length,
  };

  return { stats, isLoading };
}

/**
 * Hook for top performers based on recognitions
 */
export function useTopPerformers(workspaceId: string | undefined) {
  const { data: recognitions = [], isLoading } = useVolunteerRecognitions(workspaceId);

  // Group by volunteer and count
  const performerMap = new Map<string, number>();
  
  recognitions.forEach((r) => {
    const current = performerMap.get(r.volunteerId) || 0;
    performerMap.set(r.volunteerId, current + 1);
  });

  const topPerformers = Array.from(performerMap.entries())
    .map(([id, count]) => ({
      volunteerId: id,
      kudosCount: count,
    }))
    .sort((a, b) => b.kudosCount - a.kudosCount)
    .slice(0, 10);

  return { topPerformers, isLoading };
}
