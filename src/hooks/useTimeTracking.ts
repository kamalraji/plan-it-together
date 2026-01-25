import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { TIME_TRACKING_COLUMNS, USER_PROFILE_COLUMNS, buildRelation } from '@/lib/supabase-columns';

export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TimeEntry {
  id: string;
  workspace_id: string;
  user_id: string;
  task_id: string | null;
  date: string;
  hours: number;
  description: string | null;
  status: TimeEntryStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyTimesheet {
  date: string;
  entries: TimeEntry[];
  totalHours: number;
}

export interface WeeklyTimesheet {
  weekStart: Date;
  weekEnd: Date;
  days: DailyTimesheet[];
  totalHours: number;
}

export function useTimeTracking(workspaceId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const timeEntriesQuery = useQuery({
    queryKey: ['time-entries', workspaceId, userId],
    queryFn: async () => {
      if (!workspaceId || !userId) return [];
      const { data, error } = await supabase
        .from('workspace_time_entries')
        .select(TIME_TRACKING_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: !!workspaceId && !!userId,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_time_entries')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', workspaceId, userId] });
      toast({ title: 'Time entry added' });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_time_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', workspaceId, userId] });
      toast({ title: 'Time entry updated' });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_time_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', workspaceId, userId] });
      toast({ title: 'Time entry removed' });
    },
  });

  const submitTimesheetMutation = useMutation({
    mutationFn: async (entryIds: string[]) => {
      const { error } = await supabase
        .from('workspace_time_entries')
        .update({ status: 'submitted' })
        .in('id', entryIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', workspaceId, userId] });
      toast({ title: 'Timesheet submitted for approval' });
    },
  });

  // Get weekly timesheet
  const getWeeklyTimesheet = (weekDate: Date = new Date()): WeeklyTimesheet => {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const days: DailyTimesheet[] = daysInWeek.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayEntries = (timeEntriesQuery.data ?? []).filter(e => e.date === dateStr);
      return {
        date: dateStr,
        entries: dayEntries,
        totalHours: dayEntries.reduce((sum, e) => sum + Number(e.hours), 0),
      };
    });

    return {
      weekStart,
      weekEnd,
      days,
      totalHours: days.reduce((sum, d) => sum + d.totalHours, 0),
    };
  };

  return {
    entries: timeEntriesQuery.data ?? [],
    isLoading: timeEntriesQuery.isLoading,
    createEntry: createEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    submitTimesheet: submitTimesheetMutation.mutate,
    getWeeklyTimesheet,
    isCreating: createEntryMutation.isPending,
    isSubmitting: submitTimesheetMutation.isPending,
  };
}

// Hook for leads/managers to view all team time entries
export function useTeamTimeEntries(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const entriesQuery = useQuery({
    queryKey: ['team-time-entries', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_time_entries')
        .select(`${TIME_TRACKING_COLUMNS.detail}, ${buildRelation('user_profiles:user_id', 'full_name, avatar_url')}`)
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const approveEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_time_entries')
        .update({ status: 'approved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-time-entries', workspaceId] });
      toast({ title: 'Time entry approved' });
    },
  });

  const rejectEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_time_entries')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-time-entries', workspaceId] });
      toast({ title: 'Time entry rejected' });
    },
  });

  // Generate workload report
  const getWorkloadReport = () => {
    const entries = entriesQuery.data ?? [];
    const userMap = new Map<string, { name: string; avatar: string; totalHours: number; entries: number }>();

    entries.forEach((entry: any) => {
      const userId = entry.user_id;
      const existing = userMap.get(userId) || {
        name: entry.user_profiles?.full_name || 'Unknown',
        avatar: entry.user_profiles?.avatar_url || '',
        totalHours: 0,
        entries: 0,
      };
      existing.totalHours += Number(entry.hours);
      existing.entries += 1;
      userMap.set(userId, existing);
    });

    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  };

  return {
    entries: entriesQuery.data ?? [],
    isLoading: entriesQuery.isLoading,
    approveEntry: approveEntryMutation.mutate,
    rejectEntry: rejectEntryMutation.mutate,
    getWorkloadReport,
  };
}
