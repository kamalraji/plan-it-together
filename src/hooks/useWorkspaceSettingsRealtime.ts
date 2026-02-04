import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time workspace settings changes.
 * When settings are updated by another user, the local cache is invalidated
 * and a notification is shown.
 */
export function useWorkspaceSettingsRealtime(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    // Subscribe to workspace settings changes
    const settingsChannel = supabase
      .channel(`workspace-settings-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspaces',
          filter: `id=eq.${workspaceId}`,
        },
        (payload) => {
          // Invalidate workspace data to refetch
          queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['workspace-data', workspaceId] });
          
          // Show notification about settings update
          const newData = payload.new as { name?: string };
          toast.info('Workspace settings updated', {
            description: newData?.name 
              ? `Settings for "${newData.name}" were updated by another user.`
              : 'Workspace settings have been updated.',
          });
        }
      )
      .subscribe();

    // Subscribe to workspace automation rules changes
    const automationChannel = supabase
      .channel(`workspace-automation-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_automation_rules',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate automation rules cache
          queryClient.invalidateQueries({ 
            queryKey: ['workspace-automation-rules', workspaceId] 
          });
        }
      )
      .subscribe();

    // Subscribe to escalation rules changes
    const escalationChannel = supabase
      .channel(`workspace-escalation-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escalation_rules',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate escalation rules cache
          queryClient.invalidateQueries({ 
            queryKey: ['escalation-rules', workspaceId] 
          });
        }
      )
      .subscribe();

    // Subscribe to time tracking settings changes
    const timeTrackingChannel = supabase
      .channel(`workspace-time-tracking-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_time_tracking_settings',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate time tracking settings cache
          queryClient.invalidateQueries({ 
            queryKey: ['workspace-time-tracking-settings', workspaceId] 
          });
        }
      )
      .subscribe();

    // Subscribe to recurring task configs changes
    const recurringTasksChannel = supabase
      .channel(`workspace-recurring-tasks-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_recurring_task_configs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate recurring tasks cache
          queryClient.invalidateQueries({ 
            queryKey: ['workspace-recurring-tasks', workspaceId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(automationChannel);
      supabase.removeChannel(escalationChannel);
      supabase.removeChannel(timeTrackingChannel);
      supabase.removeChannel(recurringTasksChannel);
    };
  }, [workspaceId, queryClient]);
}
