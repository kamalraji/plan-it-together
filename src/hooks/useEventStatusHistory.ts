import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { EVENT_STATUS_HISTORY_COLUMNS, USER_PROFILE_COLUMNS } from '@/lib/supabase-columns';

export interface EventStatusHistoryItem {
  id: string;
  eventId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string | null;
  changedByName: string | null;
  reason: string | null;
  createdAt: string;
}

export function useEventStatusHistory(eventId: string) {
  const historyQuery = useQuery({
    queryKey: ['event-status-history', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_status_history')
        .select(EVENT_STATUS_HISTORY_COLUMNS.detail)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch user names
      const userIds = [...new Set(data.map((r: any) => r.changed_by).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('user_profiles').select(USER_PROFILE_COLUMNS.minimal).in('id', userIds)
        : { data: [] as { id: string; full_name: string | null }[] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      return data.map((r: any) => ({
        id: r.id,
        eventId: r.event_id,
        previousStatus: r.previous_status,
        newStatus: r.new_status,
        changedBy: r.changed_by,
        changedByName: r.changed_by ? profileMap.get(r.changed_by) || null : null,
        reason: r.reason,
        createdAt: r.created_at,
      })) as EventStatusHistoryItem[];
    },
    enabled: !!eventId,
  });

  return {
    history: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    refetch: historyQuery.refetch,
  };
}
