/**
 * Automation Trigger Hook
 * Calls the automation rules edge function when task events occur
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskStatus } from '@/types';

type AutomationTriggerType =
  | 'STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'OVERDUE'
  | 'DUE_DATE_APPROACHING';

interface TriggerAutomationParams {
  triggerType: AutomationTriggerType;
  taskId: string;
  workspaceId: string;
  oldStatus?: TaskStatus;
  newStatus?: TaskStatus;
}

export function useAutomationTrigger() {
  const triggerAutomation = useCallback(async ({
    triggerType,
    taskId,
    workspaceId,
    oldStatus,
    newStatus,
  }: TriggerAutomationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-automation-rules', {
        body: {
          trigger_type: triggerType,
          task_id: taskId,
          workspace_id: workspaceId,
          old_status: oldStatus,
          new_status: newStatus,
        },
      });

      if (error) {
        console.error('Automation trigger failed:', error);
        return { success: false, error };
      }

      console.log('Automation processed:', data);
      return { success: true, data };
    } catch (err) {
      console.error('Automation trigger error:', err);
      return { success: false, error: err };
    }
  }, []);

  const onStatusChange = useCallback(
    (taskId: string, workspaceId: string, oldStatus: TaskStatus, newStatus: TaskStatus) => {
      return triggerAutomation({
        triggerType: 'STATUS_CHANGED',
        taskId,
        workspaceId,
        oldStatus,
        newStatus,
      });
    },
    [triggerAutomation]
  );

  const onTaskCreated = useCallback(
    (taskId: string, workspaceId: string) => {
      return triggerAutomation({
        triggerType: 'TASK_CREATED',
        taskId,
        workspaceId,
      });
    },
    [triggerAutomation]
  );

  const onTaskAssigned = useCallback(
    (taskId: string, workspaceId: string) => {
      return triggerAutomation({
        triggerType: 'ASSIGNED',
        taskId,
        workspaceId,
      });
    },
    [triggerAutomation]
  );

  const onTaskUnassigned = useCallback(
    (taskId: string, workspaceId: string) => {
      return triggerAutomation({
        triggerType: 'UNASSIGNED',
        taskId,
        workspaceId,
      });
    },
    [triggerAutomation]
  );

  return {
    triggerAutomation,
    onStatusChange,
    onTaskCreated,
    onTaskAssigned,
    onTaskUnassigned,
  };
}
