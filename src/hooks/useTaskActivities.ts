import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskActivity, ActivityType } from '@/lib/commentTypes';
import { useEffect } from 'react';

interface UseTaskActivitiesOptions {
  taskId: string;
  enabled?: boolean;
  limit?: number;
}

export function useTaskActivities({ taskId, enabled = true, limit = 50 }: UseTaskActivitiesOptions) {
  const {
    data: activities = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['task-activities', taskId, limit],
    queryFn: async () => {
      const { data: activitiesData, error } = await supabase
        .from('task_activities')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const userIds = [...new Set(activitiesData.map(a => a.user_id))];
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      const mappedActivities: TaskActivity[] = activitiesData.map(a => ({
        id: a.id,
        task_id: a.task_id,
        user_id: a.user_id,
        activity_type: a.activity_type as ActivityType,
        description: a.description,
        metadata: (a.metadata as Record<string, unknown>) || {},
        created_at: a.created_at,
        user: userMap.get(a.user_id) ? {
          id: userMap.get(a.user_id)!.id,
          full_name: userMap.get(a.user_id)!.full_name || 'Unknown',
          avatar_url: userMap.get(a.user_id)!.avatar_url || undefined,
        } : undefined,
      }));

      return mappedActivities;
    },
    enabled: enabled && !!taskId,
  });

  useEffect(() => {
    if (!taskId || !enabled) return;

    const channel = supabase
      .channel(`task-activities-${taskId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_activities', filter: `task_id=eq.${taskId}` }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId, enabled, refetch]);

  return { activities, isLoading, refetch };
}
