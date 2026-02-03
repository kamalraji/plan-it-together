/**
 * Event Schedule Data Hooks
 * Industrial-grade implementation for event sessions and workspace milestones
 * Provides real-time data, CRUD operations, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

// ============================================
// Types
// ============================================

export interface EventSession {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  room: string | null;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  speaker_name: string | null;
  speaker_avatar: string | null;
  attendee_count: number | null;
  tags: string[] | null;
  is_published: boolean | null;
  track_id: string | null;
  stream_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMilestone {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completed_at: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  type: 'milestone' | 'alert' | 'completed' | 'current';
  description?: string;
  dueDate?: string;
}

// ============================================
// Event Sessions Hook
// ============================================

export function useEventSessions(eventId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all sessions for an event
  const sessionsQuery = useQuery({
    queryKey: queryKeys.events.sessions(eventId || ''),
    queryFn: async (): Promise<EventSession[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_sessions')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Map database status to our typed status
      return (data || []).map(session => ({
        ...session,
        status: mapSessionStatus(session.status, session.start_time, session.end_time),
      })) as EventSession[];
    },
    enabled: !!eventId,
    ...queryPresets.standard,
  });

  // Create session
  const createSession = useMutation({
    mutationFn: async (session: Omit<EventSession, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('event_sessions')
        .insert({
          ...session,
          status: session.status || 'upcoming',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newSession) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events.sessions(eventId || '') });
      
      const previousSessions = queryClient.getQueryData<EventSession[]>(
        queryKeys.events.sessions(eventId || '')
      );

      // Optimistic update
      const optimisticSession: EventSession = {
        ...newSession,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as EventSession;

      queryClient.setQueryData<EventSession[]>(
        queryKeys.events.sessions(eventId || ''),
        (old) => [...(old || []), optimisticSession].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      );

      return { previousSessions };
    },
    onError: (_err, _newSession, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(
          queryKeys.events.sessions(eventId || ''),
          context.previousSessions
        );
      }
      toast.error('Failed to create session');
    },
    onSuccess: () => {
      toast.success('Session created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.sessions(eventId || '') });
    },
  });

  // Update session
  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EventSession> & { id: string }) => {
      const { data, error } = await supabase
        .from('event_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updatedSession) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events.sessions(eventId || '') });
      
      const previousSessions = queryClient.getQueryData<EventSession[]>(
        queryKeys.events.sessions(eventId || '')
      );

      queryClient.setQueryData<EventSession[]>(
        queryKeys.events.sessions(eventId || ''),
        (old) => (old || []).map(session =>
          session.id === updatedSession.id
            ? { ...session, ...updatedSession }
            : session
        )
      );

      return { previousSessions };
    },
    onError: (_err, _updatedSession, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(
          queryKeys.events.sessions(eventId || ''),
          context.previousSessions
        );
      }
      toast.error('Failed to update session');
    },
    onSuccess: () => {
      toast.success('Session updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.sessions(eventId || '') });
    },
  });

  // Delete session
  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events.sessions(eventId || '') });
      
      const previousSessions = queryClient.getQueryData<EventSession[]>(
        queryKeys.events.sessions(eventId || '')
      );

      queryClient.setQueryData<EventSession[]>(
        queryKeys.events.sessions(eventId || ''),
        (old) => (old || []).filter(session => session.id !== id)
      );

      return { previousSessions };
    },
    onError: (_err, _id, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(
          queryKeys.events.sessions(eventId || ''),
          context.previousSessions
        );
      }
      toast.error('Failed to delete session');
    },
    onSuccess: () => {
      toast.success('Session deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.sessions(eventId || '') });
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    createSession,
    updateSession,
    deleteSession,
  };
}

// ============================================
// Workspace Milestones Hook
// ============================================

export function useWorkspaceMilestones(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const milestonesQuery = useQuery({
    queryKey: queryKeys.workspaces.milestones(workspaceId || ''),
    queryFn: async (): Promise<WorkspaceMilestone[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []).map(milestone => ({
        ...milestone,
        status: mapMilestoneStatus(milestone.status, milestone.due_date, milestone.completed_at),
      })) as WorkspaceMilestone[];
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });

  // Create milestone
  const createMilestone = useMutation({
    mutationFn: async (milestone: Omit<WorkspaceMilestone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .insert(milestone)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.milestones(workspaceId || '') });
      toast.success('Milestone created');
    },
    onError: () => {
      toast.error('Failed to create milestone');
    },
  });

  // Update milestone
  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceMilestone> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Auto-set completed_at when marking as completed
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('workspace_milestones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updatedMilestone) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.milestones(workspaceId || '') });
      
      const previousMilestones = queryClient.getQueryData<WorkspaceMilestone[]>(
        queryKeys.workspaces.milestones(workspaceId || '')
      );

      queryClient.setQueryData<WorkspaceMilestone[]>(
        queryKeys.workspaces.milestones(workspaceId || ''),
        (old) => (old || []).map(milestone =>
          milestone.id === updatedMilestone.id
            ? { ...milestone, ...updatedMilestone }
            : milestone
        )
      );

      return { previousMilestones };
    },
    onError: (_err, _updated, context) => {
      if (context?.previousMilestones) {
        queryClient.setQueryData(
          queryKeys.workspaces.milestones(workspaceId || ''),
          context.previousMilestones
        );
      }
      toast.error('Failed to update milestone');
    },
    onSuccess: () => {
      toast.success('Milestone updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.milestones(workspaceId || '') });
    },
  });

  // Delete milestone
  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.milestones(workspaceId || '') });
      toast.success('Milestone deleted');
    },
    onError: () => {
      toast.error('Failed to delete milestone');
    },
  });

  return {
    milestones: milestonesQuery.data || [],
    isLoading: milestonesQuery.isLoading,
    error: milestonesQuery.error,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}

// ============================================
// Timeline Data Hook (transforms milestones to timeline format)
// ============================================

export function useEventTimeline(workspaceId: string | undefined) {
  const { milestones, isLoading, error } = useWorkspaceMilestones(workspaceId);

  const timelineEvents: TimelineEvent[] = milestones.map(milestone => ({
    id: milestone.id,
    time: formatRelativeTime(milestone.due_date),
    title: milestone.title,
    type: mapMilestoneToTimelineType(milestone),
    description: milestone.description || undefined,
    dueDate: milestone.due_date || undefined,
  }));

  return {
    timelineEvents,
    isLoading,
    error,
  };
}

// ============================================
// Helper Functions
// ============================================

function mapSessionStatus(
  status: string,
  startTime: string,
  endTime: string
): EventSession['status'] {
  const now = new Date();
  const start = parseISO(startTime);
  const end = parseISO(endTime);

  if (status === 'cancelled') return 'cancelled';
  if (now > end) return 'completed';
  if (now >= start && now <= end) return 'in-progress';
  return 'upcoming';
}

function mapMilestoneStatus(
  status: string,
  dueDate: string | null,
  completedAt: string | null
): WorkspaceMilestone['status'] {
  if (completedAt || status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  
  if (dueDate && isPast(parseISO(dueDate))) {
    return 'overdue';
  }
  
  return 'pending';
}

function mapMilestoneToTimelineType(
  milestone: WorkspaceMilestone
): TimelineEvent['type'] {
  if (milestone.status === 'completed') return 'completed';
  if (milestone.status === 'overdue') return 'alert';
  
  if (milestone.due_date) {
    const dueDate = parseISO(milestone.due_date);
    if (isToday(dueDate)) return 'current';
  }
  
  return 'milestone';
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'No date';
  
  const date = parseISO(dateString);
  const now = new Date();
  const daysDiff = differenceInDays(date, now);

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (daysDiff > 0 && daysDiff <= 7) return `In ${daysDiff} days`;
  if (daysDiff < 0 && daysDiff >= -7) return `${Math.abs(daysDiff)} days ago`;
  if (daysDiff < 0) return format(date, 'MMM d');
  
  return format(date, 'MMM d');
}

export function formatSessionTime(startTime: string): string {
  return format(parseISO(startTime), 'hh:mm a');
}

export function getSessionTypeFromTags(tags: string[] | null): string {
  if (!tags || tags.length === 0) return 'session';
  
  const typeMap: Record<string, string> = {
    keynote: 'keynote',
    workshop: 'session',
    break: 'break',
    networking: 'networking',
    panel: 'session',
    lunch: 'break',
  };

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    if (typeMap[lowerTag]) return typeMap[lowerTag];
  }
  
  return 'session';
}
