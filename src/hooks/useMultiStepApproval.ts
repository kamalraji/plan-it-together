/**
 * Multi-Step Approval Chain Hook
 * Uses the existing task_approval_requests and task_approval_decisions tables
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// Types
// ============================================

export type ApprovalChainType = 'sequential' | 'parallel' | 'any';

export interface ApprovalStep {
  id: string;
  stepOrder: number;
  approverId: string;
  approverName?: string;
  approverRole?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decidedAt?: string;
  comments?: string;
  isRequired: boolean;
}

export interface ApprovalChain {
  id: string;
  requestId: string;
  requestType: 'budget' | 'resource' | 'task' | 'custom';
  chainType: ApprovalChainType;
  steps: ApprovalStep[];
  currentStepOrder: number;
  status: 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface CreateChainInput {
  taskId: string;
  originalStatus: string;
  targetStatus: string;
  approvers: Array<{
    userId: string;
    role: string;
    level: number;
  }>;
}

// ============================================
// Hook Implementation
// ============================================

export function useMultiStepApproval(requestId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch approval chain for a request
  const chainQuery = useQuery({
    queryKey: ['approval-chain', requestId],
    queryFn: async (): Promise<ApprovalChain | null> => {
      if (!requestId) return null;

      // Fetch the approval request
      const { data: request, error } = await supabase
        .from('task_approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error || !request) return null;

      // Fetch the decisions (steps)
      const { data: decisions } = await supabase
        .from('task_approval_decisions')
        .select('*')
        .eq('request_id', requestId)
        .order('level', { ascending: true });

      const steps: ApprovalStep[] = (decisions || []).map((decision) => ({
        id: decision.id,
        stepOrder: decision.level,
        approverId: decision.approver_id,
        approverRole: decision.approver_role,
        status: decision.decision === 'approved' ? 'approved' 
          : decision.decision === 'rejected' ? 'rejected'
          : 'pending',
        decidedAt: decision.decided_at,
        comments: decision.notes || undefined,
        isRequired: true,
      }));

      return {
        id: request.id,
        requestId: request.task_id,
        requestType: 'task',
        chainType: 'sequential',
        steps,
        currentStepOrder: request.current_level,
        status: request.overall_status === 'approved' ? 'approved' 
          : request.overall_status === 'rejected' ? 'rejected'
          : 'in_progress',
        createdAt: request.created_at,
        completedAt: request.completed_at || undefined,
      };
    },
    enabled: !!requestId,
  });

  // Approve current step
  const approveStep = useMutation({
    mutationFn: async ({ stepId, comments }: { stepId: string; comments?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('task_approval_decisions')
        .update({
          decision: 'approved',
          decided_at: new Date().toISOString(),
          notes: comments,
        })
        .eq('id', stepId)
        .eq('approver_id', user.id);

      if (error) throw error;

      // Check if all levels are approved
      const chain = chainQuery.data;
      if (chain) {
        const updatedSteps = chain.steps.map(s => 
          s.id === stepId ? { ...s, status: 'approved' as const } : s
        );
        const allApproved = updatedSteps.every(s => s.status === 'approved');

        if (allApproved) {
          await supabase
            .from('task_approval_requests')
            .update({
              overall_status: 'approved',
              completed_at: new Date().toISOString(),
              final_decision_by: user.id,
            })
            .eq('id', chain.id);
        } else {
          // Move to next level
          const nextLevel = chain.currentStepOrder + 1;
          await supabase
            .from('task_approval_requests')
            .update({ current_level: nextLevel })
            .eq('id', chain.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chain', requestId] });
      toast.success('Step approved');
    },
    onError: (error: Error) => {
      toast.error('Failed to approve: ' + error.message);
    },
  });

  // Reject step (ends the chain)
  const rejectStep = useMutation({
    mutationFn: async ({ stepId, comments }: { stepId: string; comments?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error: stepError } = await supabase
        .from('task_approval_decisions')
        .update({
          decision: 'rejected',
          decided_at: new Date().toISOString(),
          notes: comments,
        })
        .eq('id', stepId)
        .eq('approver_id', user.id);

      if (stepError) throw stepError;

      // Mark the entire request as rejected
      const chain = chainQuery.data;
      if (chain) {
        await supabase
          .from('task_approval_requests')
          .update({
            overall_status: 'rejected',
            completed_at: new Date().toISOString(),
            final_decision_by: user.id,
            final_decision_notes: comments,
          })
          .eq('id', chain.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chain', requestId] });
      toast.success('Step rejected');
    },
    onError: (error: Error) => {
      toast.error('Failed to reject: ' + error.message);
    },
  });

  // Create approval chain
  const createChain = useMutation({
    mutationFn: async (input: CreateChainInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create the request
      const { data: request, error: requestError } = await supabase
        .from('task_approval_requests')
        .insert({
          task_id: input.taskId,
          original_status: input.originalStatus,
          target_status: input.targetStatus,
          overall_status: 'pending',
          current_level: 1,
          requested_by: user.id,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create the decision records for each level
      const decisions = input.approvers.map(approver => ({
        request_id: request.id,
        level: approver.level,
        approver_id: approver.userId,
        approver_role: approver.role,
        decision: 'pending',
      }));

      const { error: decisionsError } = await supabase
        .from('task_approval_decisions')
        .insert(decisions);

      if (decisionsError) throw decisionsError;

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chain'] });
      toast.success('Approval chain created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create approval chain: ' + error.message);
    },
  });

  // Get current user's pending steps
  const myPendingSteps = chainQuery.data?.steps.filter(
    step => step.approverId === user?.id && step.status === 'pending'
  ) || [];

  const canApprove = myPendingSteps.length > 0;
  const currentStep = chainQuery.data?.steps.find(
    s => s.stepOrder === chainQuery.data?.currentStepOrder
  );

  return {
    chain: chainQuery.data,
    isLoading: chainQuery.isLoading,
    currentStep,
    myPendingSteps,
    canApprove,
    approveStep: approveStep.mutate,
    rejectStep: rejectStep.mutate,
    createChain: createChain.mutate,
    isApproving: approveStep.isPending,
    isRejecting: rejectStep.isPending,
    isCreating: createChain.isPending,
  };
}

// ============================================
// Fetch all pending approvals for current user
// ============================================

export function useMyPendingApprovals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-pending-approvals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch pending decisions for the current user
      const { data: decisions, error } = await supabase
        .from('task_approval_decisions')
        .select('*')
        .eq('approver_id', user.id)
        .eq('decision', 'pending');

      if (error) return [];

      // Fetch the associated requests
      const requestIds = [...new Set(decisions.map(d => d.request_id))];
      if (requestIds.length === 0) return [];

      const { data: requests } = await supabase
        .from('task_approval_requests')
        .select('id, task_id')
        .in('id', requestIds);

      // Fetch task details
      const taskIds = requests?.map(r => r.task_id) || [];
      const { data: tasks } = await supabase
        .from('workspace_tasks')
        .select('id, title, workspace_id')
        .in('id', taskIds);

      const taskMap = new Map(tasks?.map(t => [t.id, t]) || []);
      const requestMap = new Map(requests?.map(r => [r.id, r]) || []);

      return decisions.map(decision => {
        const request = requestMap.get(decision.request_id);
        const task = request ? taskMap.get(request.task_id) : null;
        return {
          stepId: decision.id,
          stepOrder: decision.level,
          requestId: decision.request_id,
          taskId: request?.task_id,
          taskTitle: task?.title,
          workspaceId: task?.workspace_id,
        };
      });
    },
    enabled: !!user?.id,
  });
}
