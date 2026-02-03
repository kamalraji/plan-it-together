/**
 * Approval Workflow Hook
 * Industrial-grade implementation for cross-workspace approval routing
 * Uses workspace_budget_requests and workspace_resource_requests tables
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// Types
// ============================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalType = 'budget' | 'resource';

export interface ApprovalRequest {
  id: string;
  requesting_workspace_id: string;
  requesting_workspace_name?: string;
  target_workspace_id: string;
  request_type: ApprovalType;
  title: string;
  reason: string;
  amount: number;
  status: ApprovalStatus;
  priority?: string;
  requested_by: string;
  requested_by_name?: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

// ============================================
// Query Keys
// ============================================

const approvalKeys = {
  all: ['approval-workflow'] as const,
  budgetRequests: (workspaceId: string) => [...approvalKeys.all, 'budget', workspaceId] as const,
  resourceRequests: (workspaceId: string) => [...approvalKeys.all, 'resource', workspaceId] as const,
  pending: (workspaceId: string) => [...approvalKeys.all, 'pending', workspaceId] as const,
};

// ============================================
// Budget Requests Hook
// ============================================

export function useBudgetApprovals(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch budget requests where this workspace is the target (needs to approve)
  const pendingQuery = useQuery({
    queryKey: approvalKeys.budgetRequests(workspaceId || ''),
    queryFn: async (): Promise<ApprovalRequest[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .select(`
          id,
          requesting_workspace_id,
          target_workspace_id,
          reason,
          requested_amount,
          status,
          priority,
          requested_by,
          reviewed_by,
          reviewed_at,
          review_notes,
          created_at,
          requesting_workspace:workspaces!requesting_workspace_id(name)
        `)
        .eq('target_workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        requesting_workspace_id: item.requesting_workspace_id,
        requesting_workspace_name: (item.requesting_workspace as { name: string } | null)?.name || '',
        target_workspace_id: item.target_workspace_id,
        request_type: 'budget' as ApprovalType,
        title: `Budget Request`,
        reason: item.reason,
        amount: Number(item.requested_amount),
        status: item.status?.toLowerCase() as ApprovalStatus || 'pending',
        priority: item.priority || undefined,
        requested_by: item.requested_by,
        reviewed_by: item.reviewed_by,
        reviewed_at: item.reviewed_at,
        review_notes: item.review_notes,
        created_at: item.created_at,
      }));
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  // Approve budget request
  const approveBudgetRequest = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: approvalKeys.budgetRequests(workspaceId || '') });
      
      const previous = queryClient.getQueryData<ApprovalRequest[]>(
        approvalKeys.budgetRequests(workspaceId || '')
      );

      queryClient.setQueryData<ApprovalRequest[]>(
        approvalKeys.budgetRequests(workspaceId || ''),
        (old) => (old || []).map(r => 
          r.id === requestId ? { ...r, status: 'approved' as ApprovalStatus } : r
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          approvalKeys.budgetRequests(workspaceId || ''),
          context.previous
        );
      }
      toast.error('Failed to approve request');
    },
    onSuccess: () => {
      toast.success('Budget request approved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.budgetRequests(workspaceId || '') });
    },
  });

  // Reject budget request
  const rejectBudgetRequest = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Request rejected',
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.budgetRequests(workspaceId || '') });
      toast.success('Budget request rejected');
    },
    onError: () => {
      toast.error('Failed to reject request');
    },
  });

  const pendingRequests = pendingQuery.data?.filter(r => r.status === 'pending') || [];
  const approvedRequests = pendingQuery.data?.filter(r => r.status === 'approved') || [];
  const rejectedRequests = pendingQuery.data?.filter(r => r.status === 'rejected') || [];

  return {
    requests: pendingQuery.data || [],
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    isLoading: pendingQuery.isLoading,
    approveBudgetRequest,
    rejectBudgetRequest,
    pendingCount: pendingRequests.length,
  };
}

// ============================================
// Resource Requests Hook
// ============================================

export function useResourceApprovals(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const requestsQuery = useQuery({
    queryKey: approvalKeys.resourceRequests(workspaceId || ''),
    queryFn: async (): Promise<ApprovalRequest[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .select(`
          id,
          requesting_workspace_id,
          target_workspace_id,
          purpose,
          quantity,
          status,
          priority,
          requested_by,
          reviewed_by,
          reviewed_at,
          review_notes,
          created_at,
          requesting_workspace:workspaces!requesting_workspace_id(name)
        `)
        .eq('target_workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        requesting_workspace_id: item.requesting_workspace_id,
        requesting_workspace_name: (item.requesting_workspace as { name: string } | null)?.name || '',
        target_workspace_id: item.target_workspace_id,
        request_type: 'resource' as ApprovalType,
        title: `Resource Request`,
        reason: item.purpose || '',
        amount: item.quantity || 1,
        status: item.status?.toLowerCase() as ApprovalStatus || 'pending',
        priority: item.priority || undefined,
        requested_by: item.requested_by,
        reviewed_by: item.reviewed_by,
        reviewed_at: item.reviewed_at,
        review_notes: item.review_notes,
        created_at: item.created_at,
      }));
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  // Approve resource request
  const approveResourceRequest = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.resourceRequests(workspaceId || '') });
      toast.success('Resource request approved');
    },
    onError: () => {
      toast.error('Failed to approve request');
    },
  });

  // Reject resource request
  const rejectResourceRequest = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Request rejected',
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.resourceRequests(workspaceId || '') });
      toast.success('Resource request rejected');
    },
    onError: () => {
      toast.error('Failed to reject request');
    },
  });

  const pendingRequests = requestsQuery.data?.filter(r => r.status === 'pending') || [];

  return {
    requests: requestsQuery.data || [],
    pendingRequests,
    isLoading: requestsQuery.isLoading,
    approveResourceRequest,
    rejectResourceRequest,
    pendingCount: pendingRequests.length,
  };
}

// ============================================
// Combined Approval Workflow Hook
// ============================================

export function useApprovalWorkflow(workspaceId: string | undefined) {
  const budget = useBudgetApprovals(workspaceId);
  const resource = useResourceApprovals(workspaceId);

  const allPending = [
    ...budget.pendingRequests,
    ...resource.pendingRequests,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    pendingRequests: allPending,
    budgetRequests: budget.requests,
    resourceRequests: resource.requests,
    isLoading: budget.isLoading || resource.isLoading,
    pendingCount: budget.pendingCount + resource.pendingCount,
    approveBudgetRequest: budget.approveBudgetRequest,
    rejectBudgetRequest: budget.rejectBudgetRequest,
    approveResourceRequest: resource.approveResourceRequest,
    rejectResourceRequest: resource.rejectResourceRequest,
  };
}

// ============================================
// Stats Hook
// ============================================

export function useApprovalStats(workspaceId: string | undefined) {
  const { pendingRequests, budgetRequests, resourceRequests, isLoading } = useApprovalWorkflow(workspaceId);

  const allRequests = [...budgetRequests, ...resourceRequests];

  const stats = {
    pending: pendingRequests.length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
    total: allRequests.length,
  };

  return { stats, isLoading };
}

// ============================================
// Request Type Labels
// ============================================

export const REQUEST_TYPE_LABELS: Record<ApprovalType, string> = {
  budget: 'Budget Request',
  resource: 'Resource Request',
};

export function getRequestTypeLabel(type: ApprovalType): string {
  return REQUEST_TYPE_LABELS[type] || type;
}
