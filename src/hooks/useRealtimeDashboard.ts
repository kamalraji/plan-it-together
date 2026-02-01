/**
 * Real-Time Dashboard Hook
 * Provides unified real-time subscriptions for dashboard data
 * Subscribes to tasks, activities, milestones, and approval changes
 */
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { queryKeys } from '@/lib/query-config';

interface UseRealtimeDashboardOptions {
  eventId?: string;
  workspaceId?: string;
  enabled?: boolean;
}

export function useRealtimeDashboard(options: UseRealtimeDashboardOptions = {}) {
  const { eventId, workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Invalidation helper with debouncing
  const invalidateQueries = useCallback((type: string, payload: any) => {
    const targetWorkspaceId = payload.new?.workspace_id || payload.old?.workspace_id || workspaceId;
    
    switch (type) {
      case 'workspace_tasks':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(targetWorkspaceId) });
          queryClient.invalidateQueries({ queryKey: ['committee-stats', targetWorkspaceId] });
          queryClient.invalidateQueries({ queryKey: ['committee-tasks', targetWorkspaceId] });
        }
        if (eventId) {
          queryClient.invalidateQueries({ queryKey: ['root-dashboard', eventId] });
        }
        break;

      case 'workspace_activities':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.activities(targetWorkspaceId) });
        }
        if (eventId) {
          queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'activity-feed', eventId] });
        }
        break;

      case 'workspace_milestones':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.milestones(targetWorkspaceId) });
        }
        if (eventId) {
          queryClient.invalidateQueries({ queryKey: ['root-dashboard', eventId] });
        }
        break;

      case 'workspace_team_members':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.team(targetWorkspaceId) });
          queryClient.invalidateQueries({ queryKey: ['committee-team-members', targetWorkspaceId] });
          queryClient.invalidateQueries({ queryKey: queryKeys.team.workload(targetWorkspaceId) });
        }
        break;

      case 'budget_requests':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: ['outgoing-budget-requests', targetWorkspaceId] });
          queryClient.invalidateQueries({ queryKey: ['incoming-budget-requests'] });
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.budget(targetWorkspaceId) });
        }
        break;

      case 'resource_requests':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: ['outgoing-resource-requests', targetWorkspaceId] });
          queryClient.invalidateQueries({ queryKey: ['incoming-resource-requests'] });
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.resources(targetWorkspaceId) });
        }
        break;

      case 'volunteer_time_logs':
        if (targetWorkspaceId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.volunteerTimeLogs(targetWorkspaceId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.team.workload(targetWorkspaceId) });
        }
        break;
    }
  }, [queryClient, eventId, workspaceId]);

  useEffect(() => {
    if (!enabled || (!eventId && !workspaceId)) return;

    const channelName = eventId 
      ? `realtime-dashboard:event:${eventId}` 
      : `realtime-dashboard:workspace:${workspaceId}`;

    channelRef.current = supabase.channel(channelName);

    // Subscribe to workspace_tasks changes
    if (workspaceId) {
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('workspace_tasks', payload)
      );

      // Subscribe to workspace_activities
      channelRef.current.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_activities',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('workspace_activities', payload)
      );

      // Subscribe to workspace_milestones
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_milestones',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('workspace_milestones', payload)
      );

      // Subscribe to workspace_team_members
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_team_members',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('workspace_team_members', payload)
      );

      // Subscribe to budget_requests
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_requests',
          filter: `requesting_workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('budget_requests', payload)
      );

      // Subscribe to resource_requests
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource_requests',
          filter: `requesting_workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('resource_requests', payload)
      );

      // Subscribe to time logs
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteer_time_logs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries('volunteer_time_logs', payload)
      );
    }

    // For event-level subscriptions (root dashboard)
    if (eventId) {
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_feed_events',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => invalidateQueries('workspace_activities', payload)
      );
    }

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [eventId, workspaceId, enabled, invalidateQueries]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (workspaceId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.activities(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.milestones(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.team(workspaceId) });
    }
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['root-dashboard', eventId] });
    }
  }, [queryClient, eventId, workspaceId]);

  return { refresh };
}
