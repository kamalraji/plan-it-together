import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';

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
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch user names
      const userIds = [...new Set(data.map(r => r.changed_by).filter(Boolean))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('user_profiles').select('id, full_name').in('id', userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      return data.map(r => ({
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
