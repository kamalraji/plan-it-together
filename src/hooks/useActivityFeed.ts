/**
 * Activity Feed Hook
 * Fetches and subscribes to real-time activity events for workspaces/events
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';

export interface ActivityFeedEvent {
  id: string;
  eventId: string;
  activityType: string;
  title: string;
  description: string | null;
  userId: string | null;
  targetId: string | null;
  isHighlighted: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface UseActivityFeedOptions {
  eventId?: string;
  workspaceId?: string;
  limit?: number;
  enableRealtime?: boolean;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { eventId, workspaceId, limit = 50, enableRealtime = true } = options;
  const queryClient = useQueryClient();

  const queryKey = eventId 
    ? [...queryKeys.events.all, 'activity-feed', eventId]
    : workspaceId
    ? [...queryKeys.workspaces.detail(workspaceId), 'activity-feed']
    : ['activity-feed', 'global'];

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('activity_feed_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return (data || []).map((row): ActivityFeedEvent => ({
        id: row.id,
        eventId: row.event_id,
        activityType: row.activity_type,
        title: row.title,
        description: row.description,
        userId: row.user_id,
        targetId: row.target_id,
        isHighlighted: row.is_highlighted,
        metadata: row.metadata as Record<string, unknown> | null,
        createdAt: row.created_at,
      }));
    },
    ...queryPresets.standard,
    enabled: !!(eventId || workspaceId),
  });

  // Real-time subscription for live updates
  useEffect(() => {
    if (!enableRealtime || !eventId) return;

    const channel = supabase
      .channel(`activity-feed-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed_events',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Optimistically add new activity to the cache
          queryClient.setQueryData(queryKey, (old: ActivityFeedEvent[] = []) => {
            const newEvent: ActivityFeedEvent = {
              id: payload.new.id,
              eventId: payload.new.event_id,
              activityType: payload.new.activity_type,
              title: payload.new.title,
              description: payload.new.description,
              userId: payload.new.user_id,
              targetId: payload.new.target_id,
              isHighlighted: payload.new.is_highlighted,
              metadata: payload.new.metadata,
              createdAt: payload.new.created_at,
            };
            return [newEvent, ...old].slice(0, limit);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, enableRealtime, queryClient, queryKey, limit]);

  // Group activities by date
  const groupedByDate = activities.reduce<Record<string, ActivityFeedEvent[]>>((acc, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  // Get highlighted activities
  const highlightedActivities = activities.filter(a => a.isHighlighted);

  return {
    activities,
    groupedByDate,
    highlightedActivities,
    isLoading,
    error,
    refetch,
  };
}

// Hook specifically for approval status changes with real-time updates
export function useApprovalRealtimeUpdates(workspaceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    // Subscribe to budget_requests changes
    const budgetChannel = supabase
      .channel(`budget-requests-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_requests',
          filter: `requesting_workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate related queries
          queryClient.invalidateQueries({ 
            queryKey: ['outgoing-budget-requests', workspaceId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['workspace-budget', workspaceId] 
          });
        }
      )
      .subscribe();

    // Subscribe to resource_requests changes
    const resourceChannel = supabase
      .channel(`resource-requests-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource_requests',
          filter: `requesting_workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ 
            queryKey: ['outgoing-resource-requests', workspaceId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(budgetChannel);
      supabase.removeChannel(resourceChannel);
    };
  }, [workspaceId, queryClient]);
}

// Hook for task real-time updates
export function useTaskRealtimeUpdates(workspaceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`tasks-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.tasks.list(workspaceId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['committee-stats', workspaceId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
}
