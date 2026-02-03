import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// VIP Guests Hooks
// ============================================

export interface VIPGuest {
  id: string;
  workspace_id: string;
  event_id: string | null;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  vip_level: string;
  dietary_requirements: string | null;
  accessibility_needs: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  escort_assigned: string | null;
  seating_assignment: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type VIPGuestInsert = Omit<VIPGuest, 'id' | 'created_at' | 'updated_at'>;
export type VIPGuestUpdate = Partial<VIPGuestInsert> & { id: string };

export const useVIPGuests = (workspaceId: string) => {
  return useQuery({
    queryKey: ['vip-guests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_vip_guests')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VIPGuest[];
    },
    enabled: !!workspaceId,
  });
};

export const useCreateVIPGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guest: VIPGuestInsert) => {
      const { data, error } = await supabase
        .from('workspace_vip_guests')
        .insert(guest)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vip-guests', variables.workspace_id] });
      toast.success('VIP guest added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add VIP guest: ' + error.message);
    },
  });
};

export const useUpdateVIPGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: VIPGuestUpdate) => {
      const { data, error } = await supabase
        .from('workspace_vip_guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vip-guests', data.workspace_id] });
      toast.success('VIP guest updated');
    },
    onError: (error) => {
      toast.error('Failed to update VIP guest: ' + error.message);
    },
  });
};

export const useDeleteVIPGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_vip_guests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vip-guests', data.workspaceId] });
      toast.success('VIP guest removed');
    },
    onError: (error) => {
      toast.error('Failed to remove VIP guest: ' + error.message);
    },
  });
};

// ============================================
// Team Briefings Hooks
// ============================================

export interface TeamBriefing {
  id: string;
  workspace_id: string;
  title: string;
  briefing_type: string;
  scheduled_at: string;
  location: string | null;
  duration_minutes: number;
  agenda: string | null;
  materials_url: string | null;
  status: string;
  attendees: Array<{ user_id: string; name: string; attended: boolean }>;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TeamBriefingInsert = Omit<TeamBriefing, 'id' | 'created_at' | 'updated_at'>;
export type TeamBriefingUpdate = Partial<TeamBriefingInsert> & { id: string };

export const useTeamBriefings = (workspaceId: string) => {
  return useQuery({
    queryKey: ['team-briefings', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_briefings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as TeamBriefing[];
    },
    enabled: !!workspaceId,
  });
};

export const useCreateTeamBriefing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefing: TeamBriefingInsert) => {
      const { data, error } = await supabase
        .from('workspace_team_briefings')
        .insert(briefing)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-briefings', variables.workspace_id] });
      toast.success('Briefing scheduled successfully');
    },
    onError: (error) => {
      toast.error('Failed to schedule briefing: ' + error.message);
    },
  });
};

export const useUpdateTeamBriefing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TeamBriefingUpdate) => {
      const { data, error } = await supabase
        .from('workspace_team_briefings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-briefings', data.workspace_id] });
      toast.success('Briefing updated');
    },
    onError: (error) => {
      toast.error('Failed to update briefing: ' + error.message);
    },
  });
};

export const useDeleteTeamBriefing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_team_briefings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-briefings', data.workspaceId] });
      toast.success('Briefing removed');
    },
    onError: (error) => {
      toast.error('Failed to remove briefing: ' + error.message);
    },
  });
};

// ============================================
// Run of Show Checklists Hooks (uses workspace_checklists with phase filtering)
// ============================================

export interface RunOfShowChecklist {
  id: string;
  workspace_id: string;
  title: string;
  phase: string;
  items: Array<{ id: string; text: string; completed: boolean; critical?: boolean }>;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type RunOfShowChecklistInsert = {
  workspace_id: string;
  title: string;
  phase: string;
  items: Array<{ id: string; text: string; completed: boolean; critical?: boolean }>;
  due_date?: string | null;
};
export type RunOfShowChecklistUpdate = Partial<RunOfShowChecklistInsert> & { id: string };

const RUN_OF_SHOW_PHASES = ['pre-event', 'day-of', 'during', 'post-event'];

export const useRunOfShowChecklists = (workspaceId: string) => {
  return useQuery({
    queryKey: ['run-of-show-checklists', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select('id, workspace_id, title, phase, items, due_date, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .in('phase', RUN_OF_SHOW_PHASES)
        .order('phase', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        items: (item.items as RunOfShowChecklist['items']) || [],
      })) as RunOfShowChecklist[];
    },
    enabled: !!workspaceId,
  });
};

export const useCreateRunOfShowChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checklist: RunOfShowChecklistInsert) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .insert(checklist)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['run-of-show-checklists', variables.workspace_id] });
      toast.success('Checklist section added');
    },
    onError: (error) => {
      toast.error('Failed to add checklist: ' + error.message);
    },
  });
};

export const useUpdateRunOfShowChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: RunOfShowChecklistUpdate) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['run-of-show-checklists', data.workspace_id] });
    },
    onError: (error) => {
      toast.error('Failed to update checklist: ' + error.message);
    },
  });
};

export const useDeleteRunOfShowChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['run-of-show-checklists', data.workspaceId] });
      toast.success('Checklist removed');
    },
    onError: (error) => {
      toast.error('Failed to remove checklist: ' + error.message);
    },
  });
};

// ============================================
// Schedule Hooks (reuses workspace_event_briefings)
// ============================================

export interface EventScheduleItem {
  id: string;
  workspace_id: string;
  activity: string;
  scheduled_time: string;
  location: string | null;
  lead_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type EventScheduleInsert = {
  workspace_id: string;
  activity: string;
  scheduled_time: string;
  location?: string | null;
  lead_name?: string | null;
  status?: string;
  notes?: string | null;
};
export type EventScheduleUpdate = Partial<EventScheduleInsert> & { id: string };

export const useEventSchedule = (workspaceId: string) => {
  return useQuery({
    queryKey: ['event-schedule', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_event_briefings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as EventScheduleItem[];
    },
    enabled: !!workspaceId,
  });
};

export const useCreateScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: EventScheduleInsert) => {
      const { data, error } = await supabase
        .from('workspace_event_briefings')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-schedule', variables.workspace_id] });
      toast.success('Schedule item added');
    },
    onError: (error) => {
      toast.error('Failed to add schedule item: ' + error.message);
    },
  });
};

export const useUpdateScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EventScheduleUpdate) => {
      const { data, error } = await supabase
        .from('workspace_event_briefings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-schedule', data.workspace_id] });
      toast.success('Schedule item updated');
    },
    onError: (error) => {
      toast.error('Failed to update schedule item: ' + error.message);
    },
  });
};

export const useDeleteScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_event_briefings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-schedule', data.workspaceId] });
      toast.success('Schedule item removed');
    },
    onError: (error) => {
      toast.error('Failed to remove schedule item: ' + error.message);
    },
  });
};
