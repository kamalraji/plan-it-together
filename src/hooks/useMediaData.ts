import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// Types
export interface MediaCrew {
  id: string;
  workspace_id: string;
  user_id?: string;
  name: string;
  email?: string;
  avatar_url?: string;
  crew_type: 'photographer' | 'videographer' | 'drone' | 'audio';
  assignment?: string;
  status: 'on_duty' | 'off_duty' | 'break';
  equipment: string[];
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoverageSchedule {
  id: string;
  workspace_id: string;
  event_name: string;
  location?: string;
  start_time: string;
  end_time: string;
  coverage_type: 'photo' | 'video' | 'both';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_crew?: MediaCrew[];
}

export interface PressCredential {
  id: string;
  workspace_id: string;
  name: string;
  email?: string;
  outlet: string;
  credential_type: 'print' | 'broadcast' | 'online' | 'freelance';
  status: 'approved' | 'pending' | 'rejected';
  access_level: 'full' | 'restricted' | 'press_room_only';
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Hook for media crew
export function useMediaCrew(workspaceId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['media-crew', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_crew')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      return data as MediaCrew[];
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  const addCrewMember = useMutation({
    mutationFn: async (crew: Omit<MediaCrew, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('media_crew')
        .insert(crew)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-crew', workspaceId] });
      toast.success('Crew member added');
    },
    onError: () => toast.error('Failed to add crew member'),
  });

  const updateCrewMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MediaCrew> & { id: string }) => {
      const { data, error } = await supabase
        .from('media_crew')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-crew', workspaceId] });
      toast.success('Crew member updated');
    },
    onError: () => toast.error('Failed to update crew member'),
  });

  const deleteCrewMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media_crew').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-crew', workspaceId] });
      toast.success('Crew member removed');
    },
    onError: () => toast.error('Failed to remove crew member'),
  });

  return {
    crew: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addCrewMember,
    updateCrewMember,
    deleteCrewMember,
  };
}

// Hook for coverage schedule
export function useCoverageSchedule(workspaceId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['coverage-schedule', workspaceId],
    queryFn: async () => {
      // First get schedules
      const { data: schedules, error } = await supabase
        .from('media_coverage_schedule')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('start_time');

      if (error) throw error;

      // Then get assignments with crew info
      const { data: assignments } = await supabase
        .from('media_coverage_assignments')
        .select(`
          coverage_id,
          crew:media_crew(*)
        `)
        .in('coverage_id', schedules.map(s => s.id));

      // Merge crew into schedules
      const schedulesWithCrew = schedules.map(schedule => ({
        ...schedule,
        assigned_crew: assignments
          ?.filter(a => a.coverage_id === schedule.id)
          .map(a => a.crew)
          .filter(Boolean) ?? [],
      }));

      return schedulesWithCrew as CoverageSchedule[];
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  const addSchedule = useMutation({
    mutationFn: async (schedule: Omit<CoverageSchedule, 'id' | 'created_at' | 'updated_at' | 'assigned_crew'>) => {
      const { data, error } = await supabase
        .from('media_coverage_schedule')
        .insert(schedule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-schedule', workspaceId] });
      toast.success('Coverage slot added');
    },
    onError: () => toast.error('Failed to add coverage slot'),
  });

  const assignCrew = useMutation({
    mutationFn: async ({ coverageId, crewId }: { coverageId: string; crewId: string }) => {
      const { error } = await supabase
        .from('media_coverage_assignments')
        .insert({ coverage_id: coverageId, crew_id: crewId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-schedule', workspaceId] });
    },
  });

  return {
    schedule: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addSchedule,
    assignCrew,
  };
}

// Hook for press credentials
export function usePressCredentials(workspaceId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['press-credentials', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('press_credentials')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as PressCredential[];
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  const addCredential = useMutation({
    mutationFn: async (credential: Omit<PressCredential, 'id' | 'created_at' | 'updated_at' | 'requested_at'>) => {
      const { data, error } = await supabase
        .from('press_credentials')
        .insert(credential)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-credentials', workspaceId] });
      toast.success('Press credential request added');
    },
    onError: () => toast.error('Failed to add credential request'),
  });

  const updateCredentialStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('press_credentials')
        .update({
          status,
          approved_by: status === 'approved' ? userId : null,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['press-credentials', workspaceId] });
      toast.success(`Credential ${status}`);
    },
    onError: () => toast.error('Failed to update credential status'),
  });

  return {
    credentials: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    pendingCount: query.data?.filter(c => c.status === 'pending').length ?? 0,
    addCredential,
    updateCredentialStatus,
  };
}
