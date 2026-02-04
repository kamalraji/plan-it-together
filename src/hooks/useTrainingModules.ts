import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrainingModule {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  duration_minutes: number;
  content_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgress {
  id: string;
  workspace_id: string;
  volunteer_id: string;
  module_id: string;
  module_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number | null;
  completed_at: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerTrainingStatus {
  volunteerId: string;
  volunteerName: string;
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  percentComplete: number;
  modules: Array<{
    moduleId: string;
    moduleName: string;
    isRequired: boolean;
    status: 'not_started' | 'in_progress' | 'completed';
    score: number | null;
  }>;
}

export function useTrainingModules(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['training-modules', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as TrainingModule[];
    },
    enabled: !!workspaceId,
  });
}

export function useVolunteerTrainingProgress(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-training-progress', workspaceId],
    queryFn: async (): Promise<VolunteerTrainingStatus[]> => {
      if (!workspaceId) return [];

      // Get all training modules for this workspace
      const { data: modules } = await supabase
        .from('training_modules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order');

      if (!modules?.length) return [];

      // Get all team members with user profiles for names
      const { data: members } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role')
        .eq('workspace_id', workspaceId);

      if (!members?.length) return [];

      // Get user profiles for names
      const userIds = members.map(m => m.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Get all training progress
      const { data: progress } = await supabase
        .from('volunteer_training_progress')
        .select('*')
        .eq('workspace_id', workspaceId);

      // Build status for each volunteer
      return members.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        const memberName = profile?.full_name || profile?.email || member.role || 'Team Member';

        const memberProgress = progress?.filter(p => p.volunteer_id === member.id) || [];
        
        const moduleStatuses = modules.map(mod => {
          const prog = memberProgress.find(p => p.module_id === mod.id);
          return {
            moduleId: mod.id,
            moduleName: mod.name,
            isRequired: mod.is_required,
            status: (prog?.status || 'not_started') as 'not_started' | 'in_progress' | 'completed',
            score: prog?.score || null,
          };
        });

        const completedCount = moduleStatuses.filter(m => m.status === 'completed').length;
        const inProgressCount = moduleStatuses.filter(m => m.status === 'in_progress').length;

        return {
          volunteerId: member.id,
          volunteerName: memberName,
          totalModules: modules.length,
          completedModules: completedCount,
          inProgressModules: inProgressCount,
          percentComplete: modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0,
          modules: moduleStatuses,
        };
      });
    },
    enabled: !!workspaceId,
  });
}

export function useCreateTrainingModule(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: Partial<TrainingModule>) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('training_modules')
        .insert({
          workspace_id: workspaceId,
          name: module.name!,
          description: module.description,
          is_required: module.is_required ?? false,
          duration_minutes: module.duration_minutes ?? 30,
          content_url: module.content_url,
          sort_order: module.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules', workspaceId] });
      toast.success('Training module created');
    },
    onError: (error) => {
      toast.error('Failed to create module: ' + error.message);
    },
  });
}

export function useUpdateTrainingProgress(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ volunteerId, moduleId, moduleName, status, score }: { 
      volunteerId: string; 
      moduleId: string;
      moduleName: string;
      status: 'not_started' | 'in_progress' | 'completed';
      score?: number;
    }) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const progressPercent = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
      const completedAt = status === 'completed' ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .upsert({
          workspace_id: workspaceId,
          volunteer_id: volunteerId,
          module_id: moduleId,
          module_name: moduleName,
          status,
          progress_percent: progressPercent,
          completed_at: completedAt,
          score: score ?? null,
        }, { onConflict: 'volunteer_id,module_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-training-progress', workspaceId] });
      toast.success('Progress updated');
    },
    onError: (error) => {
      toast.error('Failed to update progress: ' + error.message);
    },
  });
}

export function useTrainingStats(workspaceId: string | undefined) {
  const { data: progressData } = useVolunteerTrainingProgress(workspaceId);
  const { data: modules } = useTrainingModules(workspaceId);

  const totalVolunteers = progressData?.length ?? 0;
  const totalModules = modules?.length ?? 0;
  const requiredModules = modules?.filter(m => m.is_required).length ?? 0;

  const volunteersFullyTrained = progressData?.filter(v => v.percentComplete === 100).length ?? 0;
  const averageCompletion = totalVolunteers > 0 
    ? Math.round(progressData!.reduce((sum, v) => sum + v.percentComplete, 0) / totalVolunteers)
    : 0;

  return {
    totalVolunteers,
    totalModules,
    requiredModules,
    volunteersFullyTrained,
    averageCompletion,
    trainingInProgress: progressData?.filter(v => v.inProgressModules > 0).length ?? 0,
  };
}
