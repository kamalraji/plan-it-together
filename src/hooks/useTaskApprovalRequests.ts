import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  TaskApprovalRequest, 
  TaskApprovalDecision, 
  ApprovalDecision,
  ApprovalLevel,
  ApprovalRequestStatus,
} from '@/lib/taskApprovalTypes';
import { TaskStatus, WorkspaceRole, TaskCategory, TaskPriority } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook for managing task approval requests
 */
export function useTaskApprovalRequests(workspaceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending approvals for the current user
  const {
    data: pendingApprovals = [],
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['task-approval-requests', 'pending', workspaceId, user?.id],
    queryFn: async () => {
      if (!workspaceId || !user?.id) return [];

      // Get all pending requests in this workspace
      const { data: requests, error } = await supabase
        .from('task_approval_requests')
        .select(`
          *,
          workspace_tasks!inner (
            id, title, category, priority, status, workspace_id
          ),
          task_approval_policies (
            id, name, approval_chain, require_all_levels
          )
        `)
        .eq('overall_status', 'PENDING')
        .eq('workspace_tasks.workspace_id', workspaceId);

      if (error) throw error;

      // Get decisions for these requests
      const requestIds = (requests || []).map(r => r.id);
      const { data: decisions } = await supabase
        .from('task_approval_decisions')
        .select('*')
        .in('request_id', requestIds);

      // Get requester info
      const requesterIds = [...new Set((requests || []).map(r => r.requested_by))];
      const { data: requesters } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', requesterIds);

      const requesterMap = new Map<string, { id: string; full_name: string; avatar_url?: string } | undefined>();
      requesters?.forEach(r => {
        requesterMap.set(r.id, { id: r.id, full_name: r.full_name || 'Unknown', avatar_url: r.avatar_url || undefined });
      });
      const decisionsMap = new Map<string, TaskApprovalDecision[]>();
      
      (decisions || []).forEach(d => {
        const existing = decisionsMap.get(d.request_id) || [];
        existing.push(mapDecisionFromDb(d));
        decisionsMap.set(d.request_id, existing);
      });

      return (requests || []).map(r => mapRequestFromDb(r, requesterMap, decisionsMap));
    },
    enabled: !!workspaceId && !!user?.id,
  });

  // Fetch approval request for a specific task
  const getRequestForTask = async (taskId: string): Promise<TaskApprovalRequest | null> => {
    const { data, error } = await supabase
      .from('task_approval_requests')
      .select(`
        *,
        task_approval_policies (
          id, name, approval_chain, require_all_levels
        )
      `)
      .eq('task_id', taskId)
      .eq('overall_status', 'PENDING')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Get decisions
    const { data: decisions } = await supabase
      .from('task_approval_decisions')
      .select('*')
      .eq('request_id', data.id)
      .order('decided_at', { ascending: true });

    // Get requester
    const { data: requester } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .eq('id', data.requested_by)
      .single();

    const requesterMap = new Map<string, { id: string; full_name: string; avatar_url?: string } | undefined>();
    if (requester) {
      requesterMap.set(requester.id, { id: requester.id, full_name: requester.full_name || 'Unknown', avatar_url: requester.avatar_url || undefined });
    }
    const decisionsMap = new Map([[data.id, (decisions || []).map(mapDecisionFromDb)]]);

    return mapRequestFromDb(data, requesterMap, decisionsMap);
  };

  // Create an approval request
  const createRequestMutation = useMutation({
    mutationFn: async ({ 
      taskId, 
      policyId,
      originalStatus,
      targetStatus = 'COMPLETED'
    }: { 
      taskId: string; 
      policyId?: string;
      originalStatus: string;
      targetStatus?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('task_approval_requests')
        .insert({
          task_id: taskId,
          policy_id: policyId,
          requested_by: user.id,
          original_status: originalStatus,
          target_status: targetStatus,
        })
        .select()
        .single();

      if (error) throw error;

      // Update task approval status
      await supabase
        .from('workspace_tasks')
        .update({ 
          approval_status: 'PENDING',
          approval_policy_id: policyId,
        })
        .eq('id', taskId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      toast.success('Approval request submitted');
    },
    onError: (error) => {
      console.error('Failed to create approval request:', error);
      toast.error('Failed to submit approval request');
    },
  });

  // Submit a decision
  const submitDecisionMutation = useMutation({
    mutationFn: async ({
      requestId,
      decision,
      notes,
      approverRole,
      level,
    }: {
      requestId: string;
      decision: ApprovalDecision;
      notes?: string;
      approverRole: string;
      level: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Insert the decision
      const { error: decisionError } = await supabase
        .from('task_approval_decisions')
        .insert({
          request_id: requestId,
          approver_id: user.id,
          approver_role: approverRole,
          level,
          decision,
          notes,
        });

      if (decisionError) throw decisionError;

      // Get the request and policy
      const { data: request } = await supabase
        .from('task_approval_requests')
        .select(`
          *,
          task_approval_policies (approval_chain, require_all_levels)
        `)
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      // Determine if this completes the approval
      const policy = request.task_approval_policies;
      let approvalChain: ApprovalLevel[] = [];
      
      try {
        const chainData = policy?.approval_chain;
        if (typeof chainData === 'string') {
          approvalChain = JSON.parse(chainData);
        } else if (Array.isArray(chainData)) {
          approvalChain = parseApprovalChain(chainData as unknown);
        }
      } catch {
        approvalChain = [];
      }

      if (decision === 'REJECTED') {
        // Rejection at any level fails the request
        await supabase
          .from('task_approval_requests')
          .update({
            overall_status: 'REJECTED',
            completed_at: new Date().toISOString(),
            final_decision_by: user.id,
            final_decision_notes: notes,
          })
          .eq('id', requestId);

        await supabase
          .from('workspace_tasks')
          .update({ approval_status: 'REJECTED' })
          .eq('id', request.task_id);

      } else if (decision === 'APPROVED') {
        const isLastLevel = level >= approvalChain.length;
        const requireAllLevels = policy?.require_all_levels ?? true;

        if (isLastLevel || !requireAllLevels) {
          // Final approval - complete the request
          await supabase
            .from('task_approval_requests')
            .update({
              overall_status: 'APPROVED',
              completed_at: new Date().toISOString(),
              final_decision_by: user.id,
              final_decision_notes: notes,
            })
            .eq('id', requestId);

          // Update task to target status
          await supabase
            .from('workspace_tasks')
            .update({ 
              approval_status: 'APPROVED',
              status: request.target_status,
            })
            .eq('id', request.task_id);
        } else {
          // Advance to next level
          await supabase
            .from('task_approval_requests')
            .update({ current_level: level + 1 })
            .eq('id', requestId);
        }
      }

      return { decision };
    },
    onSuccess: (_, { decision }) => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      
      if (decision === 'APPROVED') {
        toast.success('Task approved');
      } else if (decision === 'REJECTED') {
        toast.success('Task approval rejected');
      }
    },
    onError: (error) => {
      console.error('Failed to submit decision:', error);
      toast.error('Failed to submit decision');
    },
  });

  // Delegate approval to another user
  const delegateApprovalMutation = useMutation({
    mutationFn: async ({
      requestId,
      delegateToUserId,
      reason,
      approverRole,
      level,
    }: {
      requestId: string;
      delegateToUserId: string;
      reason?: string;
      approverRole: string;
      level: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('task_approval_decisions')
        .insert({
          request_id: requestId,
          approver_id: user.id,
          approver_role: approverRole,
          level,
          decision: 'DELEGATED',
          delegated_to: delegateToUserId,
          delegated_reason: reason,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-requests'] });
      toast.success('Approval delegated');
    },
    onError: (error) => {
      console.error('Failed to delegate:', error);
      toast.error('Failed to delegate approval');
    },
  });

  // Cancel an approval request
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: request } = await supabase
        .from('task_approval_requests')
        .select('task_id, original_status')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      await supabase
        .from('task_approval_requests')
        .update({ overall_status: 'CANCELLED' })
        .eq('id', requestId);

      // Restore task to original status
      await supabase
        .from('workspace_tasks')
        .update({ 
          approval_status: 'NONE',
          status: request.original_status,
        })
        .eq('id', request.task_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      toast.success('Approval request cancelled');
    },
    onError: (error) => {
      console.error('Failed to cancel:', error);
      toast.error('Failed to cancel approval request');
    },
  });

  return {
    pendingApprovals,
    isLoadingPending,
    refetchPending,
    getRequestForTask,
    createRequest: createRequestMutation.mutateAsync,
    submitDecision: submitDecisionMutation.mutateAsync,
    delegateApproval: delegateApprovalMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutateAsync,
    isCreatingRequest: createRequestMutation.isPending,
    isSubmittingDecision: submitDecisionMutation.isPending,
    isDelegating: delegateApprovalMutation.isPending,
    isCancelling: cancelRequestMutation.isPending,
  };
}

function mapDecisionFromDb(row: Record<string, unknown>): TaskApprovalDecision {
  return {
    id: row.id as string,
    requestId: row.request_id as string,
    approverId: row.approver_id as string,
    approverRole: row.approver_role as WorkspaceRole,
    level: row.level as number,
    decision: row.decision as ApprovalDecision,
    notes: row.notes as string | undefined,
    decidedAt: row.decided_at as string,
    delegatedTo: row.delegated_to as string | undefined,
    delegatedReason: row.delegated_reason as string | undefined,
  };
}

function mapRequestFromDb(
  row: Record<string, unknown>,
  requesterMap: Map<string, { id: string; full_name: string; avatar_url?: string } | undefined>,
  decisionsMap: Map<string, TaskApprovalDecision[]>
): TaskApprovalRequest {
  const requester = requesterMap.get(row.requested_by as string);
  const task = row.workspace_tasks as Record<string, unknown> | undefined;
  const policy = row.task_approval_policies as Record<string, unknown> | undefined;

  return {
    id: row.id as string,
    taskId: row.task_id as string,
    task: task ? {
      id: task.id as string,
      title: task.title as string,
      category: task.category as TaskCategory | undefined,
      priority: task.priority as TaskPriority | undefined,
      status: task.status as TaskStatus,
    } : undefined,
    policyId: row.policy_id as string | undefined,
    policy: policy ? {
      id: policy.id as string,
      workspaceId: '',
      name: policy.name as string,
      approvalChain: parseApprovalChain(policy.approval_chain),
      requireAllLevels: policy.require_all_levels as boolean,
      isDefault: false,
      allowSelfApproval: false,
      isEnabled: true,
      createdAt: '',
      updatedAt: '',
    } : undefined,
    requestedBy: row.requested_by as string,
    requester: requester ? {
      id: requester.id,
      name: requester.full_name || 'Unknown',
      avatarUrl: requester.avatar_url,
    } : undefined,
    requestedAt: row.requested_at as string,
    currentLevel: row.current_level as number,
    overallStatus: row.overall_status as ApprovalRequestStatus,
    completedAt: row.completed_at as string | undefined,
    finalDecisionBy: row.final_decision_by as string | undefined,
    finalDecisionNotes: row.final_decision_notes as string | undefined,
    originalStatus: row.original_status as TaskStatus,
    targetStatus: row.target_status as TaskStatus,
    decisions: decisionsMap.get(row.id as string) || [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parseApprovalChain(data: unknown): ApprovalLevel[] {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // ignore
  }
  return [];
}
