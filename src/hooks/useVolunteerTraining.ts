/**
 * Volunteer Training Hook - Database-backed training progress management
 * Replaces mock data in TrainingStatusTab component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type TrainingStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface TrainingProgress {
  id: string;
  workspaceId: string;
  volunteerId: string;
  moduleId: string;
  moduleName: string | null;
  status: TrainingStatus;
  progressPercent: number;
  completedAt: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingProgressInput {
  volunteerId: string;
  moduleId: string;
  moduleName: string;
}

// ============================================
// Helper Functions
// ============================================

function mapProgressFromDb(row: Record<string, unknown>): TrainingProgress {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    volunteerId: row.volunteer_id as string,
    moduleId: row.module_id as string,
    moduleName: row.module_name as string | null,
    status: (row.status as TrainingStatus) || 'not_started',
    progressPercent: Number(row.progress_percent) || 0,
    completedAt: row.completed_at as string | null,
    score: row.score as number | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching training progress for a workspace
 */
export function useVolunteerTraining(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.volunteerTraining(workspaceId || ''),
    queryFn: async (): Promise<TrainingProgress[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapProgressFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

/**
 * Hook for training progress mutations
 */
export function useTrainingMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.volunteerTraining(workspaceId || '');

  const startTraining = useMutation({
    mutationFn: async (input: CreateTrainingProgressInput) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      
      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .insert({
          workspace_id: workspaceId,
          volunteer_id: input.volunteerId,
          module_id: input.moduleId,
          module_name: input.moduleName,
          status: 'in_progress',
          progress_percent: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return mapProgressFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Training started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start training: ${error.message}`);
    },
  });

  const completeTraining = useMutation({
    mutationFn: async ({ id, score }: { id: string; score?: number }) => {
      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          score,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProgressFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Training completed!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete training: ${error.message}`);
    },
  });

  const resetTraining = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .update({
          status: 'in_progress',
          progress_percent: 0,
          completed_at: null,
          score: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProgressFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Training reset');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset training: ${error.message}`);
    },
  });

  return {
    startTraining,
    completeTraining,
    resetTraining,
  };
}

/**
 * Hook for training statistics
 */
export function useTrainingStats(workspaceId: string | undefined) {
  const { data: progress = [], isLoading } = useVolunteerTraining(workspaceId);

  const stats = {
    total: progress.length,
    notStarted: progress.filter((p) => p.status === 'not_started').length,
    inProgress: progress.filter((p) => p.status === 'in_progress').length,
    completed: progress.filter((p) => p.status === 'completed').length,
    overdue: progress.filter((p) => p.status === 'overdue').length,
    avgScore: (() => {
      const scored = progress.filter((p) => p.score !== null);
      if (scored.length === 0) return 0;
      return scored.reduce((sum, p) => sum + (p.score || 0), 0) / scored.length;
    })(),
    completionRate: progress.length > 0
      ? (progress.filter((p) => p.status === 'completed').length / progress.length) * 100
      : 0,
  };

  return { stats, isLoading };
}
