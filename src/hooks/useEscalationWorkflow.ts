/**
 * Escalation Workflow Hook
 * Industrial-grade implementation for auto-escalating overdue items to parent workspaces
 * Handles deadline-based escalation for approvals, tasks, and issues
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type EscalationLevel = 'parent_workspace' | 'department' | 'root';
export type EscalationStatus = 'pending' | 'escalated' | 'resolved' | 'dismissed';
export type EscalationItemType = 'task' | 'approval' | 'issue' | 'ticket';

export interface EscalationRule {
  id: string;
  workspaceId: string;
  itemType: EscalationItemType;
  triggerAfterHours: number;
  escalateTo: EscalationLevel;
  notifyRoles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface OverdueItem {
  id: string;
  type: EscalationItemType;
  title: string;
  workspaceId: string;
  workspaceName: string;
  dueDate: string;
  overdueByHours: number;
  assigneeId: string | null;
  assigneeName: string | null;
  priority: string;
}

// ============================================
// Query Keys
// ============================================

const escalationKeys = {
  all: ['escalation-workflow'] as const,
  rules: (workspaceId: string) => [...escalationKeys.all, 'rules', workspaceId] as const,
  overdueItems: (workspaceId: string) => [...escalationKeys.all, 'overdue', workspaceId] as const,
};

// ============================================
// Helper Functions
// ============================================

function calculateOverdueHours(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for managing escalation rules
 */
export function useEscalationRules(workspaceId: string | undefined) {
  const defaultRules: EscalationRule[] = [
    {
      id: 'rule-task-24h',
      workspaceId: workspaceId || '',
      itemType: 'task',
      triggerAfterHours: 24,
      escalateTo: 'parent_workspace',
      notifyRoles: ['MANAGER', 'LEAD'],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rule-approval-12h',
      workspaceId: workspaceId || '',
      itemType: 'approval',
      triggerAfterHours: 12,
      escalateTo: 'parent_workspace',
      notifyRoles: ['MANAGER', 'ADMIN'],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rule-issue-48h',
      workspaceId: workspaceId || '',
      itemType: 'issue',
      triggerAfterHours: 48,
      escalateTo: 'department',
      notifyRoles: ['OWNER', 'ADMIN'],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    rules: defaultRules,
    isLoading: false,
  };
}

/**
 * Hook for fetching overdue items that need escalation
 */
export function useOverdueItems(workspaceId: string | undefined) {
  const overdueQuery = useQuery({
    queryKey: escalationKeys.overdueItems(workspaceId || ''),
    queryFn: async (): Promise<OverdueItem[]> => {
      if (!workspaceId) return [];

      const now = new Date().toISOString();
      
      // Fetch overdue tasks
      const { data: overdueTasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, title, workspace_id, due_date, assigned_to, priority')
        .eq('workspace_id', workspaceId)
        .lt('due_date', now)
        .neq('status', 'COMPLETED')
        .neq('status', 'CANCELLED');

      if (tasksError) {
        console.error('Error fetching overdue tasks:', tasksError);
      }

      // Fetch overdue budget requests
      const { data: overdueApprovals, error: approvalsError } = await supabase
        .from('workspace_budget_requests')
        .select('id, reason, requesting_workspace_id, created_at, priority')
        .eq('target_workspace_id', workspaceId)
        .eq('status', 'pending');

      if (approvalsError) {
        console.error('Error fetching overdue approvals:', approvalsError);
      }

      const items: OverdueItem[] = [];

      // Map overdue tasks
      (overdueTasks || []).forEach(task => {
        if (task.due_date) {
          items.push({
            id: task.id,
            type: 'task',
            title: task.title,
            workspaceId: task.workspace_id,
            workspaceName: '',
            dueDate: task.due_date,
            overdueByHours: calculateOverdueHours(task.due_date),
            assigneeId: task.assigned_to,
            assigneeName: null,
            priority: task.priority || 'medium',
          });
        }
      });

      // Map pending approvals older than 24 hours
      (overdueApprovals || []).forEach(approval => {
        const hoursOld = calculateOverdueHours(approval.created_at);
        if (hoursOld > 24) {
          items.push({
            id: approval.id,
            type: 'approval',
            title: `Budget Request: ${approval.reason?.substring(0, 50) || 'Pending'}`,
            workspaceId: approval.requesting_workspace_id,
            workspaceName: '',
            dueDate: approval.created_at,
            overdueByHours: hoursOld,
            assigneeId: null,
            assigneeName: null,
            priority: approval.priority || 'medium',
          });
        }
      });

      return items.sort((a, b) => b.overdueByHours - a.overdueByHours);
    },
    enabled: !!workspaceId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  return {
    overdueItems: overdueQuery.data || [],
    isLoading: overdueQuery.isLoading,
    refetch: overdueQuery.refetch,
  };
}

/**
 * Hook for escalating items
 */
export function useEscalateItem(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const escalateMutation = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      escalateTo,
      message,
    }: {
      itemId: string;
      itemType: EscalationItemType;
      escalateTo: EscalationLevel;
      message?: string;
    }) => {
      // Get parent workspace for escalation
      let targetWorkspaceId = workspaceId;
      
      if (escalateTo === 'parent_workspace' && workspaceId) {
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('parent_workspace_id')
          .eq('id', workspaceId)
          .single();
        
        if (workspace?.parent_workspace_id) {
          targetWorkspaceId = workspace.parent_workspace_id;
        }
      }

      // Get current user for notification
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Create notification for escalation
      if (userId) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'ESCALATION',
            title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Escalated`,
            message: message || `A ${itemType} has been escalated due to being overdue.`,
            category: 'workspace',
            action_url: `/workspace/${targetWorkspaceId}`,
            metadata: {
              item_id: itemId,
              item_type: itemType,
              escalated_from: workspaceId,
              escalated_to: targetWorkspaceId,
              escalate_level: escalateTo,
            },
          });

        if (notifError) {
          console.error('Error creating escalation notification:', notifError);
        }
      }

      return { success: true, targetWorkspaceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escalationKeys.overdueItems(workspaceId || '') });
      toast.success('Item escalated to parent workspace');
    },
    onError: () => {
      toast.error('Failed to escalate item');
    },
  });

  return {
    escalateItem: escalateMutation.mutate,
    isEscalating: escalateMutation.isPending,
  };
}

/**
 * Combined hook for full escalation workflow
 */
export function useEscalationWorkflow(workspaceId: string | undefined) {
  const { rules, isLoading: rulesLoading } = useEscalationRules(workspaceId);
  const { overdueItems, isLoading: itemsLoading, refetch } = useOverdueItems(workspaceId);
  const { escalateItem, isEscalating } = useEscalateItem(workspaceId);

  // Find items that match escalation rules
  const itemsNeedingEscalation = overdueItems.filter(item => {
    const matchingRule = rules.find(
      rule => rule.itemType === item.type && rule.isActive
    );
    return matchingRule && item.overdueByHours >= matchingRule.triggerAfterHours;
  });

  // Auto-escalate function
  const autoEscalate = async () => {
    for (const item of itemsNeedingEscalation) {
      const matchingRule = rules.find(
        rule => rule.itemType === item.type && rule.isActive
      );
      
      if (matchingRule) {
        escalateItem({
          itemId: item.id,
          itemType: item.type,
          escalateTo: matchingRule.escalateTo,
          message: `Auto-escalated: ${item.title} is ${item.overdueByHours} hours overdue`,
        });
      }
    }
  };

  // Calculate stats
  const stats = {
    totalOverdue: overdueItems.length,
    needingEscalation: itemsNeedingEscalation.length,
    byType: {
      tasks: overdueItems.filter(i => i.type === 'task').length,
      approvals: overdueItems.filter(i => i.type === 'approval').length,
      issues: overdueItems.filter(i => i.type === 'issue').length,
      tickets: overdueItems.filter(i => i.type === 'ticket').length,
    },
    avgOverdueHours: overdueItems.length > 0
      ? Math.round(overdueItems.reduce((sum, i) => sum + i.overdueByHours, 0) / overdueItems.length)
      : 0,
  };

  return {
    rules,
    overdueItems,
    itemsNeedingEscalation,
    isLoading: rulesLoading || itemsLoading,
    isEscalating,
    escalateItem,
    autoEscalate,
    refetch,
    stats,
  };
}

// ============================================
// SLA Helpers
// ============================================

export function getSLAStatus(overdueByHours: number): 'on_track' | 'at_risk' | 'breached' {
  if (overdueByHours <= 0) return 'on_track';
  if (overdueByHours <= 4) return 'at_risk';
  return 'breached';
}

export function formatOverdueTime(hours: number): string {
  if (hours < 1) return 'Less than 1 hour';
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
}
